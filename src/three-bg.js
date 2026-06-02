// three-bg.js — light-theme background scene
// A floating procedural mechanical keyboard (inspired by 3d-portfolio keyboard heroes).
// Built from rounded keycaps on a base plate — no external GLTF asset required.
// Keys ripple with a traveling "type" wave + occasional accent key presses.
// Mouse-follow, scroll-aware. Tuned to sit quietly behind the content.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function initThreeBg() {
  const canvas = document.getElementById("three-bg");
  if (!canvas) {
    console.warn("three-bg: missing canvas");
    return;
  }

  // ---------- renderer + scene ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  // ---------- palette (matches the site tokens) ----------
  const COL_KEYCAP = new THREE.Color(0xf3f1ea); // warm off-white
  const COL_KEYSIDE = new THREE.Color(0xdedacd); // key side / shadow
  const COL_BASE = new THREE.Color(0xcbc6ba); // deck
  const COL_ACCENT_BLUE = new THREE.Color(0x1d4ed8);
  const COL_ACCENT_CORAL = new THREE.Color(0xd97757);
  const COL_ACCENT_GREEN = new THREE.Color(0x0a8754);

  // ---------- lights (soft studio) ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9bd, 0.95));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(4, 8, 6);
  scene.add(keyLight);
  const rimBlue = new THREE.PointLight(0x2563eb, 2.2, 22);
  rimBlue.position.set(-5, 2, 3);
  scene.add(rimBlue);
  const rimCoral = new THREE.PointLight(0xd97757, 1.6, 20);
  rimCoral.position.set(5, -1, 2);
  scene.add(rimCoral);

  // ---------- keyboard group ----------
  const keyboard = new THREE.Group();
  scene.add(keyboard);

  // layout grid
  const COLS = 14;
  const ROWS = 5;
  const PITCH = 0.5; // distance between key centres
  const CAP = 0.42; // keycap footprint
  const CAP_H = 0.34; // keycap height
  const deckW = COLS * PITCH + 0.5;
  const deckD = ROWS * PITCH + 0.5;

  // deck / base plate
  const deckGeo = new RoundedBoxGeometry(deckW, 0.34, deckD, 4, 0.12);
  const deckMat = new THREE.MeshStandardMaterial({
    color: COL_BASE, roughness: 0.72, metalness: 0.12, transparent: true, opacity: 1,
  });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = -0.18;
  keyboard.add(deck);

  // shared keycap geometry
  const capGeo = new RoundedBoxGeometry(CAP, CAP_H, CAP, 3, 0.07);

  // a few accent key coordinates [row, col] (row 0 = back)
  const accentMap = new Map();
  const key = (r, c) => `${r},${c}`;
  accentMap.set(key(0, 0), COL_ACCENT_CORAL); // esc
  accentMap.set(key(2, COLS - 1), COL_ACCENT_BLUE); // enter-ish
  accentMap.set(key(1, COLS - 1), COL_ACCENT_BLUE);
  accentMap.set(key(0, COLS - 1), COL_ACCENT_GREEN);
  accentMap.set(key(4, 1), COL_ACCENT_BLUE);

  const keys = [];
  const x0 = -((COLS - 1) * PITCH) / 2;
  const z0 = -((ROWS - 1) * PITCH) / 2;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // bottom row: leave a wide gap so we can drop in a spacebar
      const isSpaceZone = r === ROWS - 1 && c >= 4 && c <= 9;
      if (isSpaceZone && c !== 4) continue;

      const accent = accentMap.get(key(r, c));
      const mat = new THREE.MeshStandardMaterial({
        color: accent ? accent.clone() : COL_KEYCAP.clone(),
        roughness: accent ? 0.45 : 0.6,
        metalness: accent ? 0.25 : 0.08,
        emissive: accent ? accent.clone() : new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 1,
      });

      let geo = capGeo;
      let wMul = 1;
      if (isSpaceZone && c === 4) {
        // spacebar: a wide keycap spanning the gap
        wMul = 6;
        geo = new RoundedBoxGeometry(CAP * 6 + PITCH * 5, CAP_H, CAP, 3, 0.07);
      }

      const cap = new THREE.Mesh(geo, mat);
      const cx = x0 + c * PITCH + (isSpaceZone && c === 4 ? (PITCH * 5) / 2 : 0);
      const cz = z0 + r * PITCH;
      const baseY = CAP_H / 2 - 0.02;
      cap.position.set(cx, baseY, cz);
      keyboard.add(cap);

      keys.push({
        mesh: cap,
        mat,
        baseY,
        isAccent: !!accent,
        accent: accent ? accent.clone() : null,
        // phase used by the traveling wave
        phase: (cx * 0.6 + cz * 1.1),
        press: 0, // current manual press (0..1)
      });
    }
  }

  // tilt the deck back so we read the key tops in perspective
  keyboard.rotation.x = -0.62;
  keyboard.position.set(0, 0.1, -1.2);

  // randomly "press" keys over time (typing feel)
  const pressQueue = [];
  function scheduleTyping() {
    const k = keys[Math.floor(Math.random() * keys.length)];
    pressQueue.push({ k, t: 0, dur: 0.18 + Math.random() * 0.12 });
  }
  let typeTimer = 0;

  // ---------- subtle ink particles (kept from before) ----------
  const PCOUNT = 46;
  const pPositions = new Float32Array(PCOUNT * 3);
  const pColors = new Float32Array(PCOUNT * 3);
  const pSizes = new Float32Array(PCOUNT);
  for (let i = 0; i < PCOUNT; i++) {
    const r = 5 + Math.random() * 10;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pPositions[i * 3] = r * Math.sin(p) * Math.cos(t);
    pPositions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.6;
    pPositions[i * 3 + 2] = r * Math.cos(p);
    const which = Math.random();
    if (which < 0.7) { pColors[i * 3] = 0.15; pColors[i * 3 + 1] = 0.15; pColors[i * 3 + 2] = 0.18; }
    else if (which < 0.88) { pColors[i * 3] = 0.11; pColors[i * 3 + 1] = 0.30; pColors[i * 3 + 2] = 0.85; }
    else { pColors[i * 3] = 0.85; pColors[i * 3 + 1] = 0.47; pColors[i * 3 + 2] = 0.34; }
    pSizes[i] = Math.random() * 1.3 + 0.4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSizes, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: Math.min(window.devicePixelRatio, 1.5) } },
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uPx;
      void main() {
        vColor = color;
        vec3 p = position;
        p.y += sin(uTime * 0.4 + position.x * 0.3) * 0.2;
        p.x += cos(uTime * 0.3 + position.z * 0.3) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (200.0 / -mv.z) * uPx;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d);
        a *= a * 0.7;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---------- mouse follow ----------
  const mouse = new THREE.Vector2(0, 0);
  const targetMouse = new THREE.Vector2(0, 0);
  window.addEventListener("mousemove", (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  });

  let scrollY = 0;
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  // ---------- resize ----------
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- loop ----------
  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);
    pMat.uniforms.uTime.value = t;

    // mouse easing
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    // schedule random key presses
    typeTimer -= dt;
    if (typeTimer <= 0) {
      scheduleTyping();
      typeTimer = 0.12 + Math.random() * 0.3;
    }
    for (let i = pressQueue.length - 1; i >= 0; i--) {
      const q = pressQueue[i];
      q.t += dt;
      const n = q.t / q.dur;
      // down then up
      q.k.press = n < 0.5 ? n * 2 : Math.max(0, 1 - (n - 0.5) * 2);
      if (n >= 1) { q.k.press = 0; pressQueue.splice(i, 1); }
    }

    // animate keys: gentle traveling wave + manual press + accent glow
    for (const k of keys) {
      const wave = Math.sin(t * 1.6 + k.phase) * 0.5 + 0.5; // 0..1
      const waveDrop = wave * 0.05;
      const drop = waveDrop + k.press * 0.16;
      k.mesh.position.y = k.baseY - drop;
      if (k.isAccent) {
        k.mat.emissiveIntensity = 0.12 + wave * 0.35 + k.press * 0.6;
      } else if (k.press > 0) {
        k.mat.emissive.copy(COL_ACCENT_BLUE);
        k.mat.emissiveIntensity = k.press * 0.25;
      } else {
        k.mat.emissiveIntensity = 0;
      }
    }

    // keyboard idle float + mouse tilt
    keyboard.rotation.x = -0.62 + mouse.y * 0.18 + Math.sin(t * 0.5) * 0.02;
    keyboard.rotation.y = mouse.x * 0.3 + Math.sin(t * 0.35) * 0.04;
    keyboard.position.y = 0.1 + Math.sin(t * 0.6) * 0.08;

    // accent rim lights drift
    rimBlue.position.x = -5 + Math.sin(t * 0.4) * 1.5;
    rimCoral.position.x = 5 + Math.cos(t * 0.35) * 1.5;

    // scroll: keyboard recedes + fades, lights dim
    const sNorm = Math.min(scrollY / (window.innerHeight * 6), 1);
    camera.position.z = 8 + sNorm * 2.4;
    keyboard.position.z = -1.2 - sNorm * 2.2;
    keyboard.scale.setScalar(1 - sNorm * 0.22);
    const fade = 1 - sNorm * 0.45;
    deckMat.opacity = fade;
    for (const k of keys) k.mat.opacity = fade;
    keyLight.intensity = 1.15 * fade;
    rimBlue.intensity = 2.2 * fade;
    rimCoral.intensity = 1.6 * fade;

    // particles
    particles.rotation.y = t * 0.03;
    particles.rotation.x = mouse.y * 0.08;

    // camera parallax
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, -1.2);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
