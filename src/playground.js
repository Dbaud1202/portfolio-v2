// playground.js — three small interactive Three.js scenes for the Playground section
// Each scene attaches to a canvas with id `play-N` (0,1,2)

import * as THREE from 'three';

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  r.setClearColor(0xf6f5f0, 1);
  return r;
}

// ---- shared pastel iridescent shader ----
function makeIriMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDistort: { value: 0 } },
    vertexShader: `
      uniform float uTime;
      uniform float uDistort;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 p = position;
        p += normal * sin(uTime * 1.5 + position.x * 3.0) * 0.08 * uDistort;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vView = normalize(-mv.xyz);
        vPos = p;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPos;
      void main() {
        float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 1.5);
        float band = vNormal.y * 0.5 + 0.5 + sin(uTime * 0.5 + vPos.x * 1.8) * 0.2;
        vec3 sky    = vec3(0.62, 0.78, 0.98);
        vec3 lavnd  = vec3(0.78, 0.74, 0.95);
        vec3 coral  = vec3(1.00, 0.74, 0.62);
        vec3 mint   = vec3(0.70, 0.92, 0.82);
        vec3 col;
        if (band < 0.33)      col = mix(sky, lavnd, band * 3.0);
        else if (band < 0.66) col = mix(lavnd, coral, (band - 0.33) * 3.0);
        else                  col = mix(coral, mint, (band - 0.66) * 3.0);
        col = mix(col, vec3(1.0), fres * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

// ---------- Scene 1: draggable cube ----------
function cubeScene(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.z = 4;

  const mat = makeIriMat();
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4, 16, 16, 16), mat);
  scene.add(cube);

  const wire = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 1.55, 1.55),
    new THREE.MeshBasicMaterial({ color: 0x1d4ed8, wireframe: true, transparent: true, opacity: 0.2 })
  );
  scene.add(wire);

  // grid floor — subtle ink lines
  const grid = new THREE.GridHelper(8, 16, 0x1d4ed8, 0xc8c4ba);
  grid.position.y = -1.5;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);

  let dragging = false;
  let lastX = 0, lastY = 0;
  let rotX = 0.3, rotY = 0.5;
  let velX = 0.003, velY = 0.005;

  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false; canvas.style.cursor = "grab";
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    velX = dy * 0.0005;
    velY = dx * 0.0005;
    lastX = e.clientX; lastY = e.clientY;
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    if (!dragging) { rotX += velX; rotY += velY; }
    cube.rotation.x = rotX;
    cube.rotation.y = rotY;
    wire.rotation.x = rotX;
    wire.rotation.y = rotY;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

// ---------- Scene 2: torus that distorts on hover ----------
function torusScene(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.z = 4;

  const mat = makeIriMat();
  const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(0.85, 0.28, 200, 32), mat);
  scene.add(torus);

  let hover = 0;
  let hoverTarget = 0;
  canvas.addEventListener("pointerenter", () => hoverTarget = 1);
  canvas.addEventListener("pointerleave", () => hoverTarget = 0);

  let mouseX = 0, mouseY = 0;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouseY = -(((e.clientY - r.top) / r.height) * 2 - 1);
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    hover += (hoverTarget - hover) * 0.08;
    mat.uniforms.uDistort.value = hover;
    torus.rotation.y = t * 0.4 + mouseX * 0.5;
    torus.rotation.x = t * 0.25 + mouseY * 0.3;
    torus.scale.setScalar(1 + hover * 0.1);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

// ---------- Scene 3: icosahedron that explodes on click ----------
function icoScene(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.z = 4;

  const mat = makeIriMat();
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mat);
  scene.add(ico);

  // shards (separate triangles)
  const shardGroup = new THREE.Group();
  scene.add(shardGroup);
  const baseGeo = new THREE.IcosahedronGeometry(1.1, 0);
  const pos = baseGeo.attributes.position.array;
  const shards = [];
  for (let i = 0; i < pos.length; i += 9) {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(9);
    for (let j = 0; j < 9; j++) arr[j] = pos[i + j];
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    g.computeVertexNormals();
    const m = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x1d4ed8 : 0xd97757, side: THREE.DoubleSide, transparent: true });
    const mesh = new THREE.Mesh(g, m);
    const cx = (arr[0]+arr[3]+arr[6])/3;
    const cy = (arr[1]+arr[4]+arr[7])/3;
    const cz = (arr[2]+arr[5]+arr[8])/3;
    mesh.userData = {
      dir: new THREE.Vector3(cx, cy, cz).normalize(),
      rotAxis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
    };
    mesh.visible = false;
    shards.push(mesh);
    shardGroup.add(mesh);
  }

  let exploding = 0; // 0..1..2 (cooldown)
  let explodeT = 0;
  canvas.style.cursor = "pointer";
  canvas.addEventListener("pointerdown", () => {
    if (exploding > 0) return;
    exploding = 1;
    explodeT = 0;
    ico.visible = false;
    shards.forEach((s) => {
      s.visible = true;
      s.position.set(0,0,0);
      s.rotation.set(0,0,0);
      s.material.opacity = 1;
    });
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    ico.rotation.x = t * 0.4;
    ico.rotation.y = t * 0.3;

    if (exploding === 1) {
      explodeT += 0.016;
      const p = Math.min(explodeT / 1.4, 1);
      shards.forEach((s) => {
        s.position.x = s.userData.dir.x * p * 2.5;
        s.position.y = s.userData.dir.y * p * 2.5;
        s.position.z = s.userData.dir.z * p * 2.5;
        s.rotation.x += 0.05;
        s.rotation.y += 0.05;
        s.material.opacity = 1 - p;
      });
      if (p >= 1) {
        shards.forEach((s) => { s.visible = false; });
        ico.visible = true;
        ico.scale.setScalar(0.001);
        exploding = 2;
        explodeT = 0;
      }
    } else if (exploding === 2) {
      explodeT += 0.016;
      const p = Math.min(explodeT / 0.6, 1);
      ico.scale.setScalar(p);
      if (p >= 1) { exploding = 0; }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

export function initPlaygroundScenes() {
  const c0 = document.getElementById("play-0");
  const c1 = document.getElementById("play-1");
  const c2 = document.getElementById("play-2");
  if (c0) cubeScene(c0);
  if (c1) torusScene(c1);
  if (c2) icoScene(c2);
}
