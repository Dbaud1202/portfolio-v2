// spline-bg.js — the reference 3D keyboard, brought in as-is.
// Loads the Spline scene (public/assets/skills-keyboard.spline) with the vanilla
// @splinetool/runtime Application — same loader @splinetool/react-spline uses
// internally, but without the React wrapper (which isn't React 19 compatible).
// Rendered onto the fixed #three-bg canvas; pauses while the tab is hidden.

import { Application } from '@splinetool/runtime';

export function initSplineBg() {
  const canvas = document.getElementById('three-bg');
  if (!canvas) {
    console.warn('spline-bg: missing #three-bg canvas');
    return;
  }

  const app = new Application(canvas);
  app
    .load('/assets/skills-keyboard.spline')
    .then(() => {
      const onVisibility = () => {
        if (document.hidden) app.stop?.();
        else app.play?.();
      };
      document.addEventListener('visibilitychange', onVisibility);
    })
    .catch((err) => {
      console.warn('spline-bg: failed to load scene', err);
    });
}
