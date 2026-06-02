// three-bg.js — front-facing procedural mechanical keyboard background
// Inspired by Naresh-Khatri/3d-portfolio (a Spline "skills keyboard"): keycaps
// carry letters + social/skill legends (GITHUB / INSTAGRAM / EMAIL / skills).
// Built from rounded keycaps on a deck with per-key CanvasTexture legends — no GLTF.
// Light / Dark theme aware (listens for the `themechange` event), mouse + scroll reactive.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// ---------- theme palettes ----------
const PALETTES = {
  light: {
    keycap: 0xf3f1ea,
    deck: 0xc7c2b5,
    legend: '#34322c',
    legendAccent: '#ffffff',
    hemiSky: 0xffffff, hemiGround: 0xcfc9bd, hemiInt: 0.95,
    keyInt: 1.15, rimBlue: 2.2, rimCoral: 1.6,
  },
  dark: {
    keycap: 0x2a2b33,
    deck: 0x161620,
    legend: '#d7d7de',
    legendAccent: '#ffffff',
    hemiSky: 0x3a3a48, hemiGround: 0x0a0a10, hemiInt: 0.7,
    keyInt: 0.9, rimBlue: 3.0, rimCoral: 2.2,
  },
};

export function initThreeBg() {
  const canvas = document.getElementById("three-bg");
  if (!canvas) {
    console.warn("three-bg: missing canvas");
    return;
  }

  let theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  let P = PALETTES[theme];

  // ---------- renderer + scene ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  // accent colours (constant across themes)
  const COL_BLUE = new THREE.Color(0x1d4ed8);
  const COL_CORAL = new THREE.Color(0xd97757);
  const COL_GREEN = new THREE.Color(0x0a8754);
  const COL_VIOLET = new THREE.Color(0x6d40c4);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiInt);
  scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xffffff, P.keyInt);
  keyLight.position.set(4, 8, 6);
  scene.add(keyLight);
  const rimBlue = new THREE.PointLight(0x2563eb, P.rimBlue, 22);
  rimBlue.position.set(-5, 2, 4);
  scene.add(rimBlue);
  const rimCoral = new THREE.PointLight(0xd97757, P.rimCoral, 20);
  rimCoral.position.set(5, -1, 3);
  scene.add(rimCoral);

  // ---------- keyboard group ----------
  const keyboard = new THREE.Group();
  scene.add(keyboard);

  const COLS = 14;
  const ROWS = 5;
  const PITCH = 0.5;
  const CAP = 0.42;
  const CAP_H = 0.3;
  const deckW = COLS * PITCH + 0.55;
  const deckD = ROWS * PITCH + 0.55;

  // deck / base plate
  const deckMat = new THREE.MeshStandardMaterial({
    color: P.deck, roughness: 0.78, metalness: 0.15, transparent: true, opacity: 1,
  });
  const deck = new THREE.Mesh(new RoundedBoxGeometry(deckW, 0.34, deckD, 4, 0.12), deckMat);
  deck.position.y = -0.17;
  keyboard.add(deck);

  // legend texture factory (transparent canvas with centred text)
  function drawLegend(ctx, size, text, color) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = color;
    const long = text.length > 2;
    ctx.font = `600 ${long ? Math.max(26, 150 / text.length) : 70}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2 + 3);
  }
  function makeLegend(text, color) {
    const size = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const ctx = cv.getContext("2d");
    drawLegend(ctx, size, text, color);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return { tex, cv, ctx, size, text };
  }

  // keyboard legends — QWERTY + social + skills (social keys are accented)
  const LEGEND = [
    ["ESC", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "DEL"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "HOME"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ENTER", "PUP", "END"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "RACT", "↑", "PDN", "JS"],
    ["CTRL", "GIT", null, null, null, null, "SPACE", null, null, "GH", "IG", "@", "in", "→"],
  ];
  // accent colour per legend text
  const ACCENTS = {
    GH: COL_BLUE, IG: COL_CORAL, "@": COL_GREEN, in: COL_VIOLET,
    GIT: COL_BLUE, RACT: COL_CORAL, JS: COL_GREEN,
  };

  // shared keycap geometry (single instance, reused by every standard key)
  const capGeo = new RoundedBoxGeometry(CAP, CAP_H, CAP, 3, 0.06);

  const keys = [];
  const x0 = -((COLS - 1) * PITCH) / 2;
  const z0 = -((ROWS - 1) * PITCH) / 2;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // bottom row spacebar zone: c=4..9 → single wide key at c=4
      const isSpaceZone = r === ROWS - 1 && c >= 4 && c <= 9;
      if (isSpaceZone && c !== 4) continue;

      const rawLabel = isSpaceZone && c === 4 ? "SPACE" : LEGEND[r][c];
      const label = rawLabel == null ? "" : rawLabel;
      const accent = ACCENTS[label] || null;

      const mat = new THREE.MeshStandardMaterial({
        color: accent ? accent.clone() : new THREE.Color(P.keycap),
        roughness: accent ? 0.45 : 0.62,
        metalness: accent ? 0.25 : 0.08,
        emissive: accent ? accent.clone() : new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 1,
      });

      let geo = capGeo;
      let wide = 1;
      if (isSpaceZone && c === 4) {
        wide = 6;
        geo = new RoundedBoxGeometry(CAP * 6 + PITCH * 5, CAP_H, CAP, 3, 0.06);
      }

      const cap = new THREE.Mesh(geo, mat);
      const cx = x0 + c * PITCH + (wide > 1 ? (PITCH * 5) / 2 : 0);
      const cz = z0 + r * PITCH;
      const baseY = CAP_H / 2 - 0.02;
      cap.position.set(cx, baseY, cz);
      keyboard.add(cap);

      // legend plane on the keycap top
      let legend = null;
      if (label) {
        const color = accent ? P.legendAccent : P.legend;
        legend = makeLegend(label, color);
        const planeW = (wide > 1 ? CAP * 6 + PITCH * 5 : CAP) * 0.82;
        const lp = new THREE.Mesh(
          new THREE.PlaneGeometry(wide > 1 ? planeW : CAP * 0.82, CAP * 0.82),
          new THREE.MeshBasicMaterial({ map: legend.tex, transparent: true, opacity: 0.72, depthWrite: false })
        );
        lp.rotation.x = -Math.PI / 2;
        lp.position.y = CAP_H / 2 + 0.002;
        cap.add(lp);
      }

      keys.push({
        mesh: cap, mat, legend, label,
        baseY, isAccent: !!accent, accent: accent ? accent.clone() : null,
        phase: cx * 0.6 + cz * 1.1,
        press: 0,
      });
    }
  }

  // ---- orientation: FRONT-FACING (top tilted toward the viewer) ----
  const BASE_TILT = 0.92; // positive → keycap tops face the camera
  keyboard.rotation.x = BASE_TILT;
  keyboard.position.set(0, -0.35, -0.5);

  // typing feel — random key presses
  const pressQueue = [];
  let typeTimer = 0;
  function scheduleTyping() {
    const k = keys[Math.floor(Math.random() * keys.length)];
    pressQueue.push({ k, t: 0, dur: 0.18 + Math.random() * 0.12 });
  }

  // ---------- subtle ink particles ----------
  const PCOUNT = 44;
  const pPositions = new Float32Array(PCOUNT * 3);
  const pColors = new Float32Array(PCOUNT * 3);
  const pSizes = new Float32Array(PCOUNT);
  for (let i = 0; i < PCOUNT; i++) {
    const r = 5 + Math.random() * 10;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pPositions[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pPositions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
    pPositions[i * 3 + 2] = r * Math.cos(ph);
    const w = Math.random();
    if (w < 0.7) { pColors[i * 3] = 0.45; pColors[i * 3 + 1] = 0.45; pColors[i * 3 + 2] = 0.5; }
    else if (w < 0.88) { pColors[i * 3] = 0.11; pColors[i * 3 + 1] = 0.3; pColors[i * 3 + 2] = 0.85; }
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
      attribute float aSize; varying vec3 vColor; uniform float uTime; uniform float uPx;
      void main() {
        vColor = color; vec3 p = position;
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
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        float a = smoothstep(0.5, 0.0, d); a *= a * 0.7;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    vertexColors: true, transparent: true, depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---------- theme switching ----------
  function applyTheme(next) {
    theme = next === "dark" ? "dark" : "light";
    P = PALETTES[theme];
    deckMat.color.set(P.deck);
    hemi.color.set(P.hemiSky);
    hemi.groundColor.set(P.hemiGround);
    hemi.intensity = P.hemiInt;
    keyLight.intensity = P.keyInt;
    rimBlue.intensity = P.rimBlue;
    rimCoral.intensity = P.rimCoral;
    for (const k of keys) {
      if (!k.isAccent) k.mat.color.set(P.keycap);
      if (k.legend) {
        drawLegend(k.legend.ctx, k.legend.size, k.legend.text, k.isAccent ? P.legendAccent : P.legend);
        k.legend.tex.needsUpdate = true;
      }
    }
  }
  window.addEventListener("themechange", (e) => applyTheme(e.detail));

  // ---------- mouse + scroll ----------
  const mouse = new THREE.Vector2(0, 0);
  const targetMouse = new THREE.Vector2(0, 0);
  window.addEventListener("mousemove", (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  });
  let scrollY = 0;
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
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

    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    typeTimer -= dt;
    if (typeTimer <= 0) { scheduleTyping(); typeTimer = 0.12 + Math.random() * 0.3; }
    for (let i = pressQueue.length - 1; i >= 0; i--) {
      const q = pressQueue[i];
      q.t += dt;
      const n = q.t / q.dur;
      q.k.press = n < 0.5 ? n * 2 : Math.max(0, 1 - (n - 0.5) * 2);
      if (n >= 1) { q.k.press = 0; pressQueue.splice(i, 1); }
    }

    for (const k of keys) {
      const wave = Math.sin(t * 1.6 + k.phase) * 0.5 + 0.5;
      k.mesh.position.y = k.baseY - (wave * 0.04 + k.press * 0.15);
      if (k.isAccent) {
        k.mat.emissiveIntensity = 0.14 + wave * 0.35 + k.press * 0.6;
      } else if (k.press > 0) {
        k.mat.emissive.copy(COL_BLUE);
        k.mat.emissiveIntensity = k.press * 0.25;
      } else {
        k.mat.emissiveIntensity = 0;
      }
    }

    // gentle float + mouse parallax (stays front-facing)
    keyboard.rotation.x = BASE_TILT + mouse.y * 0.12 + Math.sin(t * 0.5) * 0.015;
    keyboard.rotation.y = mouse.x * 0.22 + Math.sin(t * 0.32) * 0.03;
    keyboard.position.y = -0.35 + Math.sin(t * 0.6) * 0.07;

    rimBlue.position.x = -5 + Math.sin(t * 0.4) * 1.5;
    rimCoral.position.x = 5 + Math.cos(t * 0.35) * 1.5;

    const sNorm = Math.min(scrollY / (window.innerHeight * 6), 1);
    camera.position.z = 8 + sNorm * 2.4;
    keyboard.position.z = -0.5 - sNorm * 2.4;
    keyboard.scale.setScalar(1 - sNorm * 0.22);
    const fade = 1 - sNorm * 0.5;
    deckMat.opacity = fade;
    for (const k of keys) k.mat.opacity = fade;

    particles.rotation.y = t * 0.03;
    particles.rotation.x = mouse.y * 0.08;

    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, -0.2, -0.5);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
