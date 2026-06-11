// GalleryApp.jsx — intro hero + DOM overlay for the full-screen 3D gallery.

import { useEffect, useMemo, useRef, useState } from 'react';
import PORTFOLIO_DATA from './data.js';
import { GalleryScene, LAYOUTS } from './gallery/GalleryScene.js';

const LAYOUT_LABELS = { flat: 'Flat', tilt: 'Tilt', ring: 'Ring', gallery: 'Gallery' };
const INTRO_WHEEL_THRESHOLD = 18;

function pad2(n) {
  return String(n).padStart(2, '0');
}

// flatten the existing portfolio data into the card list shown in 3D —
// about + projects + lab + timeline + contact, numbered sequentially
function buildCards() {
  const a = PORTFOLIO_DATA.about;
  const cards = [];

  cards.push({
    title: 'ABOUT ME',
    tag: 'PROFILE',
    scope: a.hello.ko,
    body: a.intro.ko,
    stack: a.skills.flatMap((s) => s.items).slice(0, 9),
    year: 'NOW',
    team: false,
  });

  for (const p of PORTFOLIO_DATA.projects.items) {
    cards.push({
      title: p.title.en,
      tag: p.tag,
      scope: p.scope.ko,
      body: p.body.ko,
      stack: p.stack,
      year: p.year,
      team: p.team,
    });
  }

  for (const it of PORTFOLIO_DATA.playground.items) {
    cards.push({
      title: it.title.en,
      tag: 'LAB',
      scope: it.caption.ko,
      body: PORTFOLIO_DATA.playground.subtitle.ko,
      stack: ['Three.js', 'WebGL'],
      year: '2025',
      team: false,
    });
  }

  cards.push({
    title: 'TIMELINE',
    tag: 'JOURNEY',
    scope: PORTFOLIO_DATA.timeline.subtitle.ko,
    body: PORTFOLIO_DATA.timeline.items
      .map((it) => `${it.date} · ${it.org.ko} — ${it.detail.ko}`)
      .join('\n'),
    stack: [],
    year: '2023+',
    team: false,
  });

  cards.push({
    title: 'GET IN TOUCH',
    tag: 'CONTACT',
    scope: PORTFOLIO_DATA.meta.email,
    body: PORTFOLIO_DATA.contact.subtitle.ko,
    stack: [],
    year: String(new Date().getFullYear()),
    team: false,
    isContact: true,
  });

  return cards.map((card, i) => ({ ...card, index: pad2(i + 1) }));
}

// typewriter — cycles through role phrases on the hero
function useTypewriter(phrases, { typeMs = 70, eraseMs = 35, holdMs = 1400, gapMs = 350 } = {}) {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const target = phrases[idx % phrases.length];
    let cancelled = false;
    let timeout;
    function step(i, phase) {
      if (cancelled) return;
      if (phase === 'type') {
        if (i <= target.length) {
          setText(target.slice(0, i));
          timeout = setTimeout(() => step(i + 1, 'type'), typeMs);
        } else {
          timeout = setTimeout(() => step(target.length, 'erase'), holdMs);
        }
      } else if (i >= 0) {
        setText(target.slice(0, i));
        timeout = setTimeout(() => step(i - 1, 'erase'), eraseMs);
      } else {
        timeout = setTimeout(() => setIdx((n) => n + 1), gapMs);
      }
    }
    step(0, 'type');
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [idx, phrases, typeMs, eraseMs, holdMs, gapMs]);
  return text;
}

const HERO_ROLES = ['FRONTEND ENGINEER', 'BACKEND ENGINEER', 'UI / UX MINDED', 'PROBLEM SOLVER'];

function Hero({ intro, onEnter }) {
  const meta = PORTFOLIO_DATA.meta;
  const typed = useTypewriter(HERO_ROLES);
  return (
    <section className={`hero${intro ? '' : ' hero-hidden'}`} aria-hidden={!intro}>
      <div className="hero-eyebrow">PORTFOLIO · {new Date().getFullYear()} — {meta.location}</div>
      <h1 className="hero-name">
        유 명 <span className="hero-name-en">YOO MYUNG</span>
      </h1>
      <p className="hero-role" aria-live="off">
        — I'M A <span className="hero-typed">{typed}</span><span className="hero-caret" aria-hidden="true" />
      </p>
      <p className="hero-tagline">{meta.tagline.ko}</p>
      <div className="hero-meta">
        <a href={`mailto:${meta.email}`}>{meta.email}</a>
        <a href={`https://${meta.github}`} target="_blank" rel="noreferrer">GITHUB</a>
        <a href={`https://${meta.instagram}`} target="_blank" rel="noreferrer">INSTAGRAM</a>
      </div>
      <button className="hero-scroll" onClick={onEnter}>
        SCROLL TO ENTER
        <span className="hero-scroll-arrow" aria-hidden="true">↓</span>
      </button>
    </section>
  );
}

export default function GalleryApp() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const introRef = useRef(true);
  const cards = useMemo(() => buildCards(), []);
  const [intro, setIntro] = useState(true);
  const [layout, setLayout] = useState('tilt');
  const [current, setCurrent] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    introRef.current = intro;
  }, [intro]);

  const enterGallery = () => {
    if (!introRef.current) return;
    introRef.current = false;
    setIntro(false);
    sceneRef.current?.replayIntro();
    sceneRef.current?.setInputEnabled(true);
  };

  const backToIntro = () => {
    introRef.current = true;
    setIntro(true);
    sceneRef.current?.setInputEnabled(false);
  };

  useEffect(() => {
    const scene = new GalleryScene(canvasRef.current, cards, {
      onIndexChange: setCurrent,
      onFocusChange: setFocusedIdx,
    });
    scene.setInputEnabled(false); // hero is up first
    sceneRef.current = scene;
    const readyTimer = setTimeout(() => setReady(true), 150);
    return () => {
      clearTimeout(readyTimer);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [cards]);

  // scrolling down on the hero enters the gallery
  useEffect(() => {
    const onWheel = (e) => {
      if (introRef.current && e.deltaY > INTRO_WHEEL_THRESHOLD) enterGallery();
    };
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (introRef.current && touchY - e.touches[0].clientY > 40) enterGallery();
    };
    let touchY = 0;
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const pickLayout = (id) => {
    setLayout(id);
    sceneRef.current?.setLayout(id);
  };

  const closeFocus = () => sceneRef.current?.setFocus(null);

  const focused = focusedIdx !== null ? cards[focusedIdx] : null;
  const meta = PORTFOLIO_DATA.meta;

  return (
    <div className={`stage${ready ? ' is-ready' : ''}${intro ? ' is-intro' : ''}`}>
      <canvas ref={canvasRef} className="stage-canvas" aria-label="3D project gallery" />

      <Hero intro={intro} onEnter={enterGallery} />

      <header className="stage-header">
        <button className="stage-brand" onClick={backToIntro} title="처음 화면으로">
          <span className="stage-brand-title">Selected Works</span>
          <span className="stage-brand-sub">{meta.name.en} — Software Engineer</span>
        </button>
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
