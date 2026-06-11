// GalleryApp.jsx — intro hero + DOM overlay for the full-screen 3D gallery.
// Bilingual (ko/en) and themeable (dark/light); both persisted to localStorage.

import { useEffect, useMemo, useRef, useState } from 'react';
import PORTFOLIO_DATA from './data.js';
import { GalleryScene, LAYOUTS } from './gallery/GalleryScene.js';

const LAYOUT_LABELS = { flat: 'Flat', tilt: 'Tilt', ring: 'Ring', gallery: 'Gallery' };
const INTRO_WHEEL_THRESHOLD = 18;

// UI strings not covered by data.js
const UI_TEXT = {
  heroRolePrefix: { ko: '— 저는 ', en: "— I'M A " },
  heroEnter: { ko: '스크롤하여 입장', en: 'SCROLL TO ENTER' },
  hintExplore: { ko: '스크롤로 탐색 · 카드를 클릭', en: 'SCROLL TO EXPLORE · CLICK A CARD' },
  hintClose: { ko: '클릭 또는 ESC로 닫기', en: 'CLICK OR ESC TO CLOSE' },
  backToIntro: { ko: '처음 화면으로', en: 'Back to intro' },
  team: { ko: '팀 프로젝트', en: 'TEAM PROJECT' },
  solo: { ko: '개인 프로젝트', en: 'SOLO PROJECT' },
  aboutTitle: 'ABOUT ME',
  timelineTitle: 'TIMELINE',
  contactTitle: 'GET IN TOUCH',
};

const HERO_ROLES = {
  ko: ['프론트엔드 엔지니어', '백엔드 엔지니어', 'UI / UX 지향 개발자', '문제 해결사'],
  en: ['FRONTEND ENGINEER', 'BACKEND ENGINEER', 'UI / UX MINDED', 'PROBLEM SOLVER'],
};

function t(val, lang) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val.ko ?? '';
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function readPref(key, fallback, allowed) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode etc. */ }
}

// flatten the existing portfolio data into the card list shown in 3D —
// about + projects + lab + timeline + contact, numbered sequentially.
// scope/body keep both languages; the active one is picked at render time.
function buildCards() {
  const a = PORTFOLIO_DATA.about;
  const cards = [];

  cards.push({
    title: UI_TEXT.aboutTitle,
    tag: 'PROFILE',
    scope: a.hello,
    body: a.intro,
    stack: a.skills.flatMap((s) => s.items).slice(0, 9),
    year: 'NOW',
    team: false,
  });

  for (const p of PORTFOLIO_DATA.projects.items) {
    cards.push({
      title: p.title.en,
      tag: p.tag,
      scope: p.scope,
      body: p.body,
      stack: p.stack,
      year: p.year,
      team: p.team,
    });
  }

  for (const it of PORTFOLIO_DATA.playground.items) {
    cards.push({
      title: it.title.en,
      tag: 'LAB',
      scope: it.caption,
      body: PORTFOLIO_DATA.playground.subtitle,
      stack: ['Three.js', 'WebGL'],
      year: '2025',
      team: false,
    });
  }

  cards.push({
    title: UI_TEXT.timelineTitle,
    tag: 'JOURNEY',
    scope: PORTFOLIO_DATA.timeline.subtitle,
    body: {
      ko: PORTFOLIO_DATA.timeline.items.map((it) => `${it.date} · ${it.org.ko} — ${it.detail.ko}`).join('\n'),
      en: PORTFOLIO_DATA.timeline.items.map((it) => `${it.date} · ${it.org.en} — ${it.detail.en}`).join('\n'),
    },
    stack: [],
    year: '2023+',
    team: false,
  });

  cards.push({
    title: UI_TEXT.contactTitle,
    tag: 'CONTACT',
    scope: PORTFOLIO_DATA.meta.email,
    body: PORTFOLIO_DATA.contact.subtitle,
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

function ThemeIcon({ theme }) {
  return theme === 'dark' ? (
    // sun — clicking switches to light
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ) : (
    // moon — clicking switches to dark
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function LangPills({ lang, onChange }) {
  return (
    <div className="layout-pills" role="group" aria-label="Language">
      {['ko', 'en'].map((id) => (
        <button
          key={id}
          className={`layout-pill pill-sm${lang === id ? ' on' : ''}`}
          onClick={() => onChange(id)}
          aria-pressed={lang === id}>
          {id.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Hero({ intro, lang, theme, onEnter, onLang, onTheme }) {
  const meta = PORTFOLIO_DATA.meta;
  const typed = useTypewriter(HERO_ROLES[lang]);
  return (
    <section className={`hero${intro ? '' : ' hero-hidden'}`} aria-hidden={!intro}>
      <div className="hero-toggles">
        <LangPills lang={lang} onChange={onLang} />
        <button
          className="icon-btn"
          onClick={onTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <ThemeIcon theme={theme} />
        </button>
      </div>

      <div className="hero-eyebrow">PORTFOLIO · {new Date().getFullYear()} — {meta.location}</div>
      <h1 className="hero-name">
        {lang === 'ko' ? '유 명' : 'YOO MYUNG'}
        <span className="hero-name-en">{lang === 'ko' ? 'YOO MYUNG' : 'SOFTWARE ENGINEER'}</span>
      </h1>
      <p className="hero-role" aria-live="off">
        {t(UI_TEXT.heroRolePrefix, lang)}
        <span className="hero-typed">{typed}</span>
        <span className="hero-caret" aria-hidden="true" />
      </p>
      <p className="hero-tagline">{t(meta.tagline, lang)}</p>
      <div className="hero-meta">
        <a href={`mailto:${meta.email}`}>{meta.email}</a>
        <a href={`https://${meta.github}`} target="_blank" rel="noreferrer">GITHUB</a>
        <a href={`https://${meta.instagram}`} target="_blank" rel="noreferrer">INSTAGRAM</a>
      </div>
      <button className="hero-scroll" onClick={onEnter}>
        {t(UI_TEXT.heroEnter, lang)}
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
  const [lang, setLang] = useState(() => readPref('lang', 'ko', ['ko', 'en']));
  const [theme, setTheme] = useState(() => readPref('theme', 'dark', ['dark', 'light']));
  const [layout, setLayout] = useState('tilt');
  const [current, setCurrent] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    introRef.current = intro;
  }, [intro]);

  // theme → document attribute + 3D scene background
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    savePref('theme', theme);
    sceneRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    savePref('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

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
    scene.setTheme(readPref('theme', 'dark', ['dark', 'light']));
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
    let touchY = 0;
    const onWheel = (e) => {
      if (introRef.current && e.deltaY > INTRO_WHEEL_THRESHOLD) enterGallery();
    };
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (introRef.current && touchY - e.touches[0].clientY > 40) enterGallery();
    };
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

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const closeFocus = () => sceneRef.current?.setFocus(null);

  const focused = focusedIdx !== null ? cards[focusedIdx] : null;
  const meta = PORTFOLIO_DATA.meta;

  return (
    <div className={`stage${ready ? ' is-ready' : ''}${intro ? ' is-intro' : ''}`}>
      <canvas ref={canvasRef} className="stage-canvas" aria-label="3D project gallery" />

      <Hero
        intro={intro}
        lang={lang}
        theme={theme}
        onEnter={enterGallery}
        onLang={setLang}
        onTheme={toggleTheme}
      />

      <header className="stage-header">
        <button className="stage-brand" onClick={backToIntro} title={t(UI_TEXT.backToIntro, lang)}>
          <span className="stage-brand-title">Selected Works</span>
          <span className="stage-brand-sub">{meta.name.en} — Software Engineer</span>
        </button>
        <div className="stage-controls">
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
          <LangPills lang={lang} onChange={setLang} />
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      <footer className="stage-footer">
        <div className="stage-footer-left">
          <span className="stage-logo" aria-hidden="true">Y</span>
          <span className="stage-hint">{focused ? t(UI_TEXT.hintClose, lang) : t(UI_TEXT.hintExplore, lang)}</span>
        </div>
        <div className="stage-counter" aria-live="polite">
          {pad2(current + 1)} <span className="dash">—</span> {pad2(cards.length)}
        </div>
      </footer>

      {focused && (
        <aside className="focus-panel" key={focused.index}>
          <div className="focus-tag">Nº {focused.index} · {focused.tag} · {focused.year}</div>
          <h2 className="focus-title">{focused.title}</h2>
          <p className="focus-scope">{t(focused.scope, lang)}</p>
          <p className="focus-body">{t(focused.body, lang)}</p>
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
            <div className="focus-role">{focused.team ? t(UI_TEXT.team, lang) : t(UI_TEXT.solo, lang)}</div>
          )}
          <button className="focus-close" onClick={closeFocus} aria-label="Close detail">×</button>
        </aside>
      )}

      <div className="stage-vignette" aria-hidden="true" />
    </div>
  );
}
