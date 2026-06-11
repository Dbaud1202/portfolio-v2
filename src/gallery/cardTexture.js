// cardTexture.js — procedural "artwork" textures for the 3D gallery cards.
// Each card gets a moody landscape-ish gradient scene (sky, glow, ridges,
// stars, grain) painted on a rounded-corner canvas, so the site needs no
// external images.

import * as THREE from 'three';

const TEX_W = 512;
const TEX_H = 720;
const CORNER_RADIUS = 36;

// deterministic PRNG so each card always renders the same art
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// moody palettes inspired by the reference footage (dusk, cosmos, valleys…)
const PALETTES = [
  { sky: ['#04141c', '#0e3a46', '#2e8d96'], glow: '#7ee8e0', ridge: '#03191f', stars: false }, // teal lagoon
  { sky: ['#1a0510', '#52132a', '#c2434f'], glow: '#ff8d66', ridge: '#160409', stars: false }, // crimson gate
  { sky: ['#05060f', '#101736', '#3a3f8f'], glow: '#9fa8ff', ridge: '#04050c', stars: true  }, // violet night
  { sky: ['#0b1006', '#243a14', '#5f8f3a'], glow: '#d6f29b', ridge: '#0a1206', stars: false }, // green highlands
  { sky: ['#140903', '#4d2410', '#c97b2e'], glow: '#ffd9a0', ridge: '#170a04', stars: false }, // desert dusk
  { sky: ['#02060d', '#0a1c33', '#27598c'], glow: '#bfe3ff', ridge: '#020710', stars: true  }, // deep ocean sky
  { sky: ['#0d0414', '#321048', '#7d3aa8'], glow: '#e9b8ff', ridge: '#0b0411', stars: true  }, // nebula purple
  { sky: ['#0a0c10', '#27313d', '#7d8fa3'], glow: '#e8f2ff', ridge: '#0b0e13', stars: false }, // misty grey peak
  { sky: ['#03100e', '#0d342c', '#2f7d63'], glow: '#a4ffd6', ridge: '#041210', stars: false }, // emerald mist
  { sky: ['#120311', '#3d0f33', '#a23a6e'], glow: '#ffb3d9', ridge: '#10040e', stars: true  }, // magenta cosmos
  { sky: ['#0c0a03', '#3a3110', '#a08a2e'], glow: '#fff0b0', ridge: '#0d0b04', stars: false }, // golden field
  { sky: ['#040810', '#11233f', '#3e6ea8'], glow: '#cfe6ff', ridge: '#040910', stars: true  }, // glacier night
];

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRidge(ctx, rand, baseY, amp, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, TEX_H);
  ctx.lineTo(0, baseY + (rand() - 0.5) * amp);
  const steps = 9;
  for (let i = 1; i <= steps; i++) {
    const x = (TEX_W / steps) * i;
    const y = baseY + (rand() - 0.5) * amp * 2 - rand() * amp * 0.6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(TEX_W, TEX_H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStars(ctx, rand, count) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * TEX_W;
    const y = rand() * TEX_H * 0.62;
    const r = rand() * 1.4 + 0.3;
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGrain(ctx, rand, count) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(rand() * TEX_W, rand() * TEX_H, 1.4, 1.4);
  }
  ctx.restore();
}

/**
 * Paint one card's artwork + label and return a THREE texture.
 * @param {{ index: string, title: string, tag: string }} card
 * @param {number} seed
 * @returns {THREE.CanvasTexture}
 */
export function makeCardTexture(card, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(seed * 7919 + 13);
  const palette = PALETTES[seed % PALETTES.length];

  ctx.clearRect(0, 0, TEX_W, TEX_H);
  roundedRectPath(ctx, 0, 0, TEX_W, TEX_H, CORNER_RADIUS);
  ctx.clip();

  // sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, TEX_H);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(0.55, palette.sky[1]);
  sky.addColorStop(1, palette.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // glow "sun" / portal light — bright core with a wide halo
  const gx = TEX_W * (0.3 + rand() * 0.4);
  const gy = TEX_H * (0.45 + rand() * 0.22);
  const gr = TEX_W * (0.55 + rand() * 0.3);
  const glow = ctx.createRadialGradient(gx, gy, 4, gx, gy, gr);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.08, palette.glow);
  glow.addColorStop(0.3, palette.glow + '88');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  if (palette.stars) drawStars(ctx, rand, 110);

  // layered ridges, far → near
  drawRidge(ctx, rand, TEX_H * 0.66, 70, palette.ridge, 0.5);
  drawRidge(ctx, rand, TEX_H * 0.76, 95, palette.ridge, 0.75);
  drawRidge(ctx, rand, TEX_H * 0.87, 110, palette.ridge, 1);

  // bottom fade for label legibility
  const fade = ctx.createLinearGradient(0, TEX_H * 0.68, 0, TEX_H);
  fade.addColorStop(0, 'transparent');
  fade.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  drawGrain(ctx, rand, 1400);

  // labels
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '500 19px "JetBrains Mono", monospace';
  ctx.fillText(`Nº ${card.index}`, 30, 48);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 17px "JetBrains Mono", monospace';
  ctx.fillText(card.tag.toUpperCase(), 30, TEX_H - 78);

  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.font = '600 33px "Space Grotesk", sans-serif';
  ctx.fillText(card.title, 30, TEX_H - 38);

  // hairline border highlight
  roundedRectPath(ctx, 1.5, 1.5, TEX_W - 3, TEX_H - 3, CORNER_RADIUS - 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
