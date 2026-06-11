// GalleryApp.jsx — DOM overlay for the full-screen 3D gallery experience.

import { useEffect, useMemo, useRef, useState } from 'react';
import PORTFOLIO_DATA from './data.js';
import { GalleryScene, LAYOUTS } from './gallery/GalleryScene.js';

const LAYOUT_LABELS = { flat: 'Flat', tilt: 'Tilt', ring: 'Ring', gallery: 'Gallery' };

function pad2(n) {
  return String(n).padStart(2, '0');
}

// flatten portfolio data into the card list shown in 3D
function buildCards() {
  const projects = PORTFOLIO_DATA.projects.items.map((p) => ({
    index: p.index,
    title: p.title.en,
    tag: p.tag,
    scope: p.scope.ko,
    body: p.body.ko,
    stack: p.stack,
    year: p.year,
    team: p.team,
  }));
  const labs = PORTFOLIO_DATA.playground.items.map((it, i) => ({
    index: pad2(projects.length + i + 1),
    title: it.title.en,
    tag: 'LAB',
    scope: it.caption.ko,
    body: PORTFOLIO_DATA.playground.subtitle.ko,
    stack: ['Three.js', 'WebGL'],
    year: '2025',
    team: false,
  }));
  const contact = {
    index: pad2(projects.length + labs.length + 1),
    title: 'GET IN TOUCH',
    tag: 'CONTACT',
    scope: PORTFOLIO_DATA.meta.email,
    body: PORTFOLIO_DATA.contact.subtitle.ko,
    stack: [],
    year: String(new Date().getFullYear()),
    team: false,
    isContact: true,
  };
  return [...projects, ...labs, contact];
}

export default function GalleryApp() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cards = useMemo(() => buildCards(), []);
  const [layout, setLayout] = useState('tilt');
  const [current, setCurrent] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const scene = new GalleryScene(canvasRef.current, cards, {
      onIndexChange: setCurrent,
      onFocusChange: setFocusedIdx,
    });
    sceneRef.current = scene;
    const readyTimer = setTimeout(() => setReady(true), 150);
    return () => {
      clearTimeout(readyTimer);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [cards]);

  const pickLayout = (id) => {
    setLayout(id);
    sceneRef.current?.setLayout(id);
  };

  const closeFocus = () => sceneRef.current?.setFocus(null);

  const focused = focusedIdx !== null ? cards[focusedIdx] : null;
  const meta = PORTFOLIO_DATA.meta;

  return (
    <div className={`stage${ready ? ' is-ready' : ''}`}>
      <canvas ref={canvasRef} className="stage-canvas" aria-label="3D project gallery" />

      <header className="stage-header">
        <div className="stage-brand">
          <span className="stage-brand-title">Selected Works</span>
          <span className="stage-brand-sub">{meta.name.en} — Software Engineer</span>
        </div>
        <nav className="layout-pills" aria-label="Gallery layout">
          {LAYOUTS.map((id) => (
            <button
              key={id}
              className={`layout-pill${layout === id ? ' on' : ''}`}
              onClick={() => pickLayout(id)}>
              {LAYOUT_LABELS[id]}
            </button>
          ))}
        </nav>
      </header>

      <footer className="stage-footer">
        <div className="stage-footer-left">
          <span className="stage-logo" aria-hidden="true">Y</span>
          <span className="stage-hint">{focused ? 'CLICK OR ESC TO CLOSE' : 'SCROLL TO EXPLORE · CLICK A CARD'}</span>
        </div>
        <div className="stage-counter" aria-live="polite">
          {pad2(current + 1)} <span className="dash">—</span> {pad2(cards.length)}
        </div>
      </footer>

      {focused && (
        <aside className="focus-panel" key={focused.index}>
          <div className="focus-tag">Nº {focused.index} · {focused.tag} · {focused.year}</div>
          <h2 className="focus-title">{focused.title}</h2>
          <p className="focus-scope">{focused.scope}</p>
          <p className="focus-body">{focused.body}</p>
          {focused.stack.length > 0 && (
            <div className="focus-stack">
              {focused.stack.map((s) => <span key={s}>{s}</span>)}
            </div>
          )}
          {focused.isContact ? (
            <div className="focus-links">
              <a href={`mailto:${meta.email}`}>✉ {meta.email}</a>
              <a href={`https://${meta.github}`} target="_blank" rel="noreferrer">◎ GITHUB</a>
              <a href={`https://${meta.instagram}`} target="_blank" rel="noreferrer">◇ INSTAGRAM</a>
            </div>
          ) : (
            <div className="focus-role">{focused.team ? 'TEAM PROJECT' : 'SOLO PROJECT'}</div>
          )}
          <button className="focus-close" onClick={closeFocus} aria-label="Close detail">×</button>
        </aside>
      )}

      <div className="stage-vignette" aria-hidden="true" />
    </div>
  );
}
