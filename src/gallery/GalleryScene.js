// GalleryScene.js — the full-screen 3D card gallery engine.
// Cards float in a dark space and morph between four layouts
// (flat / tilt / ring / gallery) with damped, staggered motion.
// Scroll (or drag) explores the set; clicking a card focuses it fullscreen.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeCardTexture } from './cardTexture.js';

export const LAYOUTS = ['flat', 'tilt', 'ring', 'gallery'];

const CARD_W = 1.32;
const CARD_H = 1.86;
const FLAT_GAP = 1.95;
const TILT_RADIUS = 14;
const TILT_ANGLE_STEP = 0.135;
const RING_RADIUS = 4.7;
const GALLERY_COL_GAP = 1.6;
const BG_COLOR = 0x0e0e10;
const MAX_DPR = 2;
const WHEEL_SENSITIVITY = 0.0016;
const DRAG_SENSITIVITY = 0.006;
const CLICK_SLOP_PX = 6;
const FOCUS_DISTANCE = 3.1;

const CAMERA_BY_LAYOUT = {
  flat: { pos: new THREE.Vector3(0, 0.1, 6.4), look: new THREE.Vector3(0, 0, 0) },
  tilt: { pos: new THREE.Vector3(0, 0.25, 6.7), look: new THREE.Vector3(0, 0, 0) },
  ring: { pos: new THREE.Vector3(0, 5.4, 8.4), look: new THREE.Vector3(0, -0.5, 0) },
  gallery: { pos: new THREE.Vector3(0, 0, 7.6), look: new THREE.Vector3(0, 0, 0) },
};

const SPHERE_BY_LAYOUT = {
  flat: new THREE.Vector3(2.0, 1.55, 0.6),
  tilt: new THREE.Vector3(2.0, 1.55, 0.6),
  ring: new THREE.Vector3(0, 0.2, 0),
  gallery: new THREE.Vector3(-2.6, 1.9, -1.5),
};

const dampVec = new THREE.Vector3();

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export class GalleryScene {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{index:string,title:string,tag:string}>} cards
   * @param {{ onIndexChange?: (i:number)=>void, onFocusChange?: (i:number|null)=>void }} callbacks
   */
  constructor(canvas, cards, callbacks = {}) {
    this.canvas = canvas;
    this.cards = cards;
    this.callbacks = callbacks;
    this.layout = 'tilt';
    this.inputEnabled = true; // host can pause input while an intro overlay is up
    this.scroll = (cards.length - 1) / 2; // start mid-row so cards spread both ways
    this.scrollVelocity = 0;
    this.focusedIndex = null;
    this.lastReportedIndex = -1;
    this.disposed = false;
    this.pointer = { down: false, moved: 0, x: 0, y: 0, lastX: 0 };
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initRenderer();
    this.initScene();
    this.initCards();
    this.initSphere();
    this.bindEvents();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // keep card artwork at its painted brightness (tone mapping muddied it)
    this.renderer.toneMapping = THREE.NoToneMapping;
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);
    this.scene.fog = new THREE.Fog(BG_COLOR, 12, 26);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
    const cam = CAMERA_BY_LAYOUT[this.layout];
    this.camera.position.copy(cam.pos);
    this.cameraLook = cam.look.clone();
    this.camera.lookAt(this.cameraLook);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;
    pmrem.dispose();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 6, 5);
    this.scene.add(key);
  }

  initCards() {
    this.cardGroup = new THREE.Group();
    this.scene.add(this.cardGroup);
    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H);

    this.meshes = this.cards.map((card, i) => {
      const texture = makeCardTexture(card, i);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        fog: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = {
        cardIndex: i,
        targetPos: new THREE.Vector3(),
        targetQuat: new THREE.Quaternion(),
        targetScale: 1,
        targetOpacity: 1,
        // varied damping per card → organic stagger during layout morphs
        lambda: 4.2 + ((i * 37) % 10) * 0.38,
        hovered: false,
      };
      this.cardGroup.add(mesh);
      return mesh;
    });

    // start collapsed at center so the first frames "bloom" outward
    for (const mesh of this.meshes) {
      mesh.position.set(0, 0, -4);
      mesh.scale.setScalar(0.6);
      mesh.material.opacity = 0;
    }
  }

  initSphere() {
    const geometry = new THREE.SphereGeometry(0.26, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x16161a,
      metalness: 1,
      roughness: 0.26,
      envMapIntensity: 1.4,
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.sphere.position.copy(SPHERE_BY_LAYOUT[this.layout]);
    this.scene.add(this.sphere);
  }

  bindEvents() {
    this.onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    this.onWheel = (e) => {
      if (!this.inputEnabled || this.focusedIndex !== null) return;
      this.scrollVelocity += e.deltaY * WHEEL_SENSITIVITY;
    };
    this.onPointerDown = (e) => {
      if (!this.inputEnabled) return;
      this.pointer.down = true;
      this.pointer.moved = 0;
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.lastX = e.clientX;
    };
    this.onPointerMove = (e) => {
      this.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      if (!this.pointer.down) return;
      this.pointer.moved += Math.abs(e.clientX - this.pointer.x) + Math.abs(e.clientY - this.pointer.y);
      if (this.focusedIndex === null) {
        this.scrollVelocity -= (e.clientX - this.pointer.lastX) * DRAG_SENSITIVITY * 0.12;
      }
      this.pointer.lastX = e.clientX;
    };
    this.onPointerUp = (e) => {
      const wasClick = this.pointer.down && this.pointer.moved < CLICK_SLOP_PX;
      this.pointer.down = false;
      if (wasClick) this.handleClick(e);
    };
    this.onKeyDown = (e) => {
      if (e.key === 'Escape' && this.focusedIndex !== null) this.setFocus(null);
    };

    window.addEventListener('resize', this.onResize);
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
  }

  handleClick(e) {
    // ignore clicks on the DOM UI layer
    if (!this.inputEnabled || e.target !== this.canvas) return;
    if (this.focusedIndex !== null) {
      this.setFocus(null);
      return;
    }
    this.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes);
    if (hits.length > 0) this.setFocus(hits[0].object.userData.cardIndex);
  }

  setLayout(layout) {
    if (!LAYOUTS.includes(layout) || layout === this.layout) return;
    this.layout = layout;
    if (this.focusedIndex !== null) this.setFocus(null);
  }

  setFocus(index) {
    this.focusedIndex = index;
    this.callbacks.onFocusChange?.(index);
  }

  setInputEnabled(enabled) {
    this.inputEnabled = enabled;
    if (!enabled && this.focusedIndex !== null) this.setFocus(null);
  }

  // collapse cards back to the center so they bloom outward again —
  // called when the intro hero is dismissed for a dramatic entrance
  replayIntro() {
    this.scroll = (this.cards.length - 1) / 2;
    this.scrollVelocity = 0;
    for (const mesh of this.meshes) {
      mesh.position.set(0, 0, -4);
      mesh.scale.setScalar(0.6);
      mesh.material.opacity = 0;
    }
  }

  // ---------- layout targets ----------

  computeTarget(i, out) {
    const n = this.cards.length;
    const s = this.scroll;
    const t = i - s;

    switch (this.layout) {
      case 'flat': {
        out.pos.set(t * FLAT_GAP, 0, 0);
        out.rotY = 0;
        out.scale = 1;
        break;
      }
      case 'tilt': {
        const ang = t * TILT_ANGLE_STEP;
        out.pos.set(
          Math.sin(ang) * TILT_RADIUS,
          -Math.abs(t) * 0.055,
          -(1 - Math.cos(ang)) * TILT_RADIUS
        );
        out.rotY = -ang * 0.95;
        out.scale = Math.max(0.82, 1 - Math.abs(t) * 0.03);
        break;
      }
      case 'ring': {
        const ang = ((i / n) - (s / n)) * Math.PI * 2;
        out.pos.set(Math.sin(ang) * RING_RADIUS, 0, Math.cos(ang) * RING_RADIUS);
        out.rotY = ang;
        out.scale = 0.86;
        break;
      }
      case 'gallery':
      default: {
        const cols = Math.ceil(n / 2);
        const col = Math.floor(i / 2);
        const row = i % 2;
        const jitter = Math.sin(i * 12.9898) * 0.5; // deterministic per-card offset
        out.pos.set(
          (col - (cols - 1) / 2) * GALLERY_COL_GAP + (row ? 0.42 : -0.18) - s * 0.12,
          (row ? -1.08 : 1.08) + jitter * 0.22,
          jitter * 0.9,
        );
        out.rotY = 0;
        out.scale = 0.88 + Math.abs(Math.sin(i * 4.7)) * 0.16;
        break;
      }
    }
  }

  applyFocusTarget(mesh) {
    // park the focused card right in front of the camera, scaled to ~fill the view
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    mesh.userData.targetPos.copy(this.camera.position).addScaledVector(forward, FOCUS_DISTANCE);
    mesh.userData.targetQuat.copy(this.camera.quaternion);
    const visibleH = 2 * FOCUS_DISTANCE * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const visibleW = visibleH * this.camera.aspect;
    mesh.userData.targetScale = Math.min(visibleH / CARD_H, visibleW / CARD_W) * 1.0;
    mesh.userData.targetOpacity = 1;
  }

  // ---------- frame loop ----------

  tick() {
    if (this.disposed) return;
    // the host window can mount at 0×0 (embedded previews) — track real size
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== window.innerWidth || size.y !== window.innerHeight) this.onResize();
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    const n = this.cards.length;

    // scroll integration + bounds (ring wraps freely, others rubber-band)
    this.scroll += this.scrollVelocity;
    this.scrollVelocity *= Math.exp(-dt * 4.5);
    if (this.layout !== 'ring') {
      const max = n - 1;
      if (this.scroll < 0) this.scroll = damp(this.scroll, 0, 8, dt);
      if (this.scroll > max) this.scroll = damp(this.scroll, max, 8, dt);
    }

    // report current index to UI
    const wrapped = ((Math.round(this.scroll) % n) + n) % n;
    if (wrapped !== this.lastReportedIndex) {
      this.lastReportedIndex = wrapped;
      this.callbacks.onIndexChange?.(wrapped);
    }

    // hover raycast (only when free-roaming)
    let hoveredIdx = -1;
    if (this.focusedIndex === null && !this.pointer.down) {
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hits = this.raycaster.intersectObjects(this.meshes);
      if (hits.length > 0) hoveredIdx = hits[0].object.userData.cardIndex;
    }
    this.canvas.style.cursor = hoveredIdx >= 0 || this.focusedIndex !== null ? 'pointer' : 'grab';

    const scratch = { pos: dampVec, rotY: 0, scale: 1 };
    const eulerScratch = new THREE.Euler();

    for (const mesh of this.meshes) {
      const ud = mesh.userData;
      const i = ud.cardIndex;

      if (this.focusedIndex === i) {
        this.applyFocusTarget(mesh);
      } else {
        this.computeTarget(i, scratch);
        ud.targetPos.copy(scratch.pos);
        if (this.focusedIndex !== null) {
          // push non-focused cards back into the dark
          ud.targetPos.z -= 7;
          ud.targetOpacity = 0;
        } else {
          ud.targetOpacity = 1;
        }
        eulerScratch.set(0, scratch.rotY, 0);
        ud.targetQuat.setFromEuler(eulerScratch);
        ud.targetScale = scratch.scale * (hoveredIdx === i ? 1.06 : 1);
        if (hoveredIdx === i) ud.targetPos.z += 0.18;
      }

      const lambda = this.reducedMotion ? 30 : ud.lambda;
      mesh.position.x = damp(mesh.position.x, ud.targetPos.x, lambda, dt);
      mesh.position.y = damp(mesh.position.y, ud.targetPos.y, lambda, dt);
      mesh.position.z = damp(mesh.position.z, ud.targetPos.z, lambda, dt);
      mesh.quaternion.slerp(ud.targetQuat, 1 - Math.exp(-lambda * dt));
      const sc = damp(mesh.scale.x, ud.targetScale, lambda, dt);
      mesh.scale.setScalar(sc);
      mesh.material.opacity = damp(mesh.material.opacity, ud.targetOpacity, 6, dt);
    }

    // camera follows layout
    const cam = CAMERA_BY_LAYOUT[this.layout];
    const camLambda = this.reducedMotion ? 30 : 3.2;
    this.camera.position.x = damp(this.camera.position.x, cam.pos.x, camLambda, dt);
    this.camera.position.y = damp(this.camera.position.y, cam.pos.y, camLambda, dt);
    this.camera.position.z = damp(this.camera.position.z, cam.pos.z, camLambda, dt);
    this.cameraLook.x = damp(this.cameraLook.x, cam.look.x, camLambda, dt);
    this.cameraLook.y = damp(this.cameraLook.y, cam.look.y, camLambda, dt);
    this.cameraLook.z = damp(this.cameraLook.z, cam.look.z, camLambda, dt);
    this.camera.lookAt(this.cameraLook);

    // floating chrome sphere
    const spherePos = SPHERE_BY_LAYOUT[this.layout];
    this.sphere.position.x = damp(this.sphere.position.x, spherePos.x, 2.5, dt);
    this.sphere.position.y = damp(this.sphere.position.y, spherePos.y + Math.sin(elapsed * 1.1) * 0.12, 2.5, dt);
    this.sphere.position.z = damp(this.sphere.position.z, spherePos.z, 2.5, dt);
    this.sphere.visible = this.focusedIndex === null;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    for (const mesh of this.meshes) {
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
    this.meshes[0]?.geometry.dispose();
    this.sphere.geometry.dispose();
    this.sphere.material.dispose();
    this.envMap.dispose();
    this.renderer.dispose();
  }
}
