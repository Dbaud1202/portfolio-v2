/* app.jsx — main portfolio React app */

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import PORTFOLIO_DATA from './data.js';
import { initPlaygroundScenes } from './playground.js';
import DotArtLab from './DotArtLab.jsx';

const DATA = PORTFOLIO_DATA;

// ============================================================
// helpers
// ============================================================
const t = (val, lang) => {
  if (val == null) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val.ko ?? "";
};

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY + window.innerHeight * 0.4;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [ids.join("|")]);
  return active;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// 3D tilt on mouse hover (CSS transform)
function useTilt(strength = 8) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -strength;
      const ry = (px - 0.5) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "perspective(1200px) rotateX(0) rotateY(0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

// scroll-reveal — blur/fade/slide-up entrance via IntersectionObserver (Magic UI "BlurFade" style)
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useReveal({ threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown];
}

// merge multiple refs (callback or object) onto a single node
function setRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r && typeof r === "object") r.current = node;
    }
  };
}

// generic reveal wrapper — staggered entrance for any block
function Reveal({ children, as: Tag = "div", className = "", delay = 0, style, ...rest }) {
  const [ref, shown] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}${shown ? " is-visible" : ""}`}
      style={{ ...style, "--reveal-delay": `${delay}ms` }}
      {...rest}>
      {children}
    </Tag>);

}

// typewriter effect — types/erases through a list of phrases
function useTypewriter(phrases, { typeMs = 70, eraseMs = 35, holdMs = 1400, gapMs = 400 } = {}) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!phrases || phrases.length === 0) return;
    let cancelled = false;
    let timeout;
    const target = phrases[idx % phrases.length];
    if (target.length === 0) return;
    function step(i, phase) {
      if (cancelled) return;
      if (phase === "type") {
        if (i <= target.length) {
          setText(target.slice(0, i));
          timeout = setTimeout(() => step(i + 1, "type"), typeMs);
        } else {
          timeout = setTimeout(() => step(target.length, "erase"), holdMs);
        }
      } else {
        if (i >= 0) {
          setText(target.slice(0, i));
          timeout = setTimeout(() => step(i - 1, "erase"), eraseMs);
        } else {
          timeout = setTimeout(() => setIdx((n) => n + 1), gapMs);
        }
      }
    }
    step(0, "type");
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [idx, phrases.join("|")]);
  return text;
}

// ============================================================
// Topbar
// ============================================================
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "라이트 모드" : "다크 모드"}>
      {isDark ?
        // sun
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg> :
        // moon
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      }
    </button>);

}

function Topbar({ lang, setLang, theme, onToggleTheme, active }) {
  const now = useClock();
  const time = now.toLocaleTimeString("en-US", { hour12: false });
  const navIds = ["home", "about", "timeline", "work", "playground", "contact"];
  return (
    <div className="topbar">
      <div className="brand">
        <span className="dot" />
        <span className="brand-name">YOO.MYUNG / S/W_ENGINEER_v26</span>
      </div>
      <nav className="nav">
        {navIds.map((id) =>
          <a key={id} href={`#${id}`} className={active === id ? "active" : ""}>
            {t(DATA.nav[id === "work" ? "work" : id], lang) || id.toUpperCase()}
          </a>
        )}
      </nav>
      <div className="top-right">
        <span className="status-clock">
          <span>SEOUL</span><span>{time}</span>
        </span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <div className="lang-toggle">
          <button className={lang === "ko" ? "on" : ""} onClick={() => setLang("ko")}>KO</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </div>
    </div>);

}

// ============================================================
// Hero
// ============================================================
function Hero({ lang }) {
  const rolesKo = ["프론트엔드", "백엔드", "UI / UX 지향", "문제 해결사", "지속적 학습자"];
  const rolesEn = ["FRONTEND ENGINEER", "BACKEND ENGINEER", "UI / UX MINDED", "PROBLEM SOLVER", "LIFELONG LEARNER"];
  const phrases = lang === "ko" ? rolesKo : rolesEn;
  const typed = useTypewriter(phrases);
  return (
    <section id="home">
      <div className="hero-grid" />
      <span className="hero-side left">SEOUL · KR · LAT 37.5665 · LON 126.9780</span>
      <span className="hero-side right">PORTFOLIO · 2026 EDITION · v1.0</span>

      <div className="hero-wrap">
        <h1 className="hero-name">
          {lang === "ko" ?
            <>
              <span className="word">유</span>
              <span className="word accent">명</span>
            </> :

            <>
              <span className="word">YOO</span>
              <span className="word outline">MYUNG</span>
            </>
          }
        </h1>
        <div className="hero-typer">
          <span className="hero-typer-prefix">{lang === "ko" ? "— " : "— I'M A "}</span>
          <span className="hero-typer-text">{typed}</span>
          <span className="hero-typer-caret" aria-hidden="true" />
        </div>

      </div>

      <div className="hero-marquee">
        <div className="track">
          {Array.from({ length: 2 }).map((_, i) =>
            <Fragment key={i}>
              <span>FULL-STACK ENGINEERING</span><span className="star">✦</span>
              <span>REACT · NODE · MONGO · SPRING</span><span className="star">✦</span>
              <span>USER EXPERIENCE FIRST</span><span className="star">✦</span>
              <span>OPEN TO COLLABORATION</span><span className="star">✦</span>
              <span>AVAILABLE FOR FREELANCE</span><span className="star">✦</span>
            </Fragment>
          )}
        </div>
      </div>

      <div className="hero-scroll">SCROLL</div>
    </section>);

}

// ============================================================
// About
// ============================================================
function ValueCard({ v, lang, idx = 0 }) {
  const tiltRef = useTilt(10);
  const [revRef, shown] = useReveal();
  return (
    <div
      className={`value-card reveal${shown ? " is-visible" : ""}`}
      ref={setRefs(tiltRef, revRef)}
      style={{ "--reveal-delay": `${idx * 80}ms` }}>
      <div className="glyph">{v.icon}</div>
      <h4>{t(v.title, lang)}</h4>
      <p>{t(v.body, lang)}</p>
    </div>);

}

function StatCard({ s, lang, idx }) {
  const tiltRef = useTilt(8);
  const [revRef, shown] = useReveal();
  return (
    <div
      className={`stat reveal${shown ? " is-visible" : ""}`}
      ref={setRefs(tiltRef, revRef)}
      style={{ "--reveal-delay": `${idx * 70}ms` }}>
      <span className="stat-tag">0{idx + 1}</span>
      <div className="num">{s.value}</div>
      <div className="lbl">{t(s.label, lang)}</div>
    </div>);

}

function About({ lang }) {
  const a = DATA.about;
  const bigTiltRef = useTilt(6);
  const [bigRevRef, bigShown] = useReveal();
  return (
    <section id="about">
      <Reveal className="section-head">
        <div className="eyebrow"><span className="id">01</span> / {lang === "ko" ? "프로필" : "PROFILE"}</div>
        <h2 className="h-display">About <span className="ink-2">Me.</span></h2>
        <p className="section-sub">{t(a.intro, lang)}</p>
      </Reveal>

      <div className="about-grid">
        <div
          className={`about-card big reveal${bigShown ? " is-visible" : ""}`}
          ref={setRefs(bigTiltRef, bigRevRef)}>
          <div className="hello">{t(a.hello, lang)}</div>
          <p className="intro">{t(a.intro, lang)}</p>
          <div className="meta-row">
            <span>{lang === "ko" ? "목표" : "GOAL"} → <b>{lang === "ko" ? "소프트웨어 엔지니어" : "SOFTWARE ENGINEER"}</b></span>
            <span>{lang === "ko" ? "지금" : "NOW"} → <b>eNsecure</b></span>
            <span>{lang === "ko" ? "상태" : "STATUS"} → <b style={{ color: "var(--cyan)" }}>{lang === "ko" ? "구직중 / 협업가능" : "AVAILABLE"}</b></span>
          </div>
        </div>

        <div className="stats-grid">
          {a.stats.map((s, i) => <StatCard key={i} s={s} lang={lang} idx={i} />)}
        </div>
      </div>

      <div className="values-grid">
        {a.values.map((v, i) => <ValueCard key={i} v={v} lang={lang} idx={i} />)}
      </div>

      <Reveal className="skills-block">
        <h3>{lang === "ko" ? "보유 기술 / TECH STACK" : "TECH STACK"}</h3>
        <div className="skills-row">
          {a.skills.map((s, i) =>
            <div key={i} className="skill-col">
              <h4>{s.group}</h4>
              <div className="skill-chips">
                {s.items.map((it) => <span key={it} className="chip">{it}</span>)}
              </div>
            </div>
          )}
        </div>
        <div className="strengths-row">
          {a.strengths.map((s, i) =>
            <span key={i} className="strength-pill">{t(s, lang)}</span>
          )}
        </div>
      </Reveal>
    </section>);

}

// ============================================================
// Timeline
// ============================================================
function Timeline({ lang }) {
  const tl = DATA.timeline;
  return (
    <section id="timeline">
      <Reveal className="section-head">
        <div className="eyebrow"><span className="id">02</span> / {lang === "ko" ? "이력" : "JOURNEY"}</div>
        <h2 className="h-display">Timeline.</h2>
        <p className="section-sub">{t(tl.subtitle, lang)}</p>
      </Reveal>
      <div className="timeline-wrap">
        {tl.items.map((it, i) =>
          <Reveal key={i} className="tl-item" data-kind={it.kind} delay={i * 90}>
            <div className="tl-card">
              <div>
                <div className="tl-kind">{it.kind === "edu" ? lang === "ko" ? "학력" : "EDUCATION" : it.kind === "work" ? lang === "ko" ? "경력" : "EXPERIENCE" : lang === "ko" ? "자격증" : "CERT"}</div>
                <div className="tl-org">{t(it.org, lang)}</div>
                <div className="tl-detail">{t(it.detail, lang)}</div>
              </div>
              <div className="tl-date">{it.date}</div>
            </div>
          </Reveal>
        )}
      </div>
    </section>);

}

// ============================================================
// Projects
// ============================================================
function ProjectCard({ p, lang, onOpen, idx = 0 }) {
  const tiltRef = useTilt(10);
  const [revRef, shown] = useReveal();
  const accentKey = p.accent === "#ff2bd1" ? "mag" : p.accent === "#c5ff4e" || p.accent === "#7cffb2" ? "lime" : p.accent === "#9d4eff" ? "vio" : "cy";
  return (
    <article
      className={`proj-card reveal${shown ? " is-visible" : ""}`}
      ref={setRefs(tiltRef, revRef)}
      data-accent={accentKey}
      style={{ "--accent": p.accent, "--reveal-delay": `${(idx % 3) * 90}ms` }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(p); } }}
      onClick={() => onOpen(p)}>

      <div className="proj-index">PRJ_{p.index}</div>
      <div className="proj-status">{p.team ? "TEAM" : "SOLO"}</div>
      <div className="proj-thumb">
        <div className="proj-thumb-grid" />
        <div className="proj-orb" />
        <div className="proj-thumb-rings" />
        <div className="proj-thumb-art">{p.index}</div>
      </div>
      <div className="proj-info">
        <div className="proj-tag-row">
          <span className="tag">{p.tag}</span>
          <span>{p.year}</span>
        </div>
        <h3 className="proj-title">{t(p.title, lang)}</h3>
        <p className="proj-scope">{t(p.scope, lang)}</p>
        <div className="proj-stack">
          {p.stack.map((s) => <span key={s}>{s}</span>)}
        </div>
      </div>
    </article>);

}

function ProjectModal({ p, lang, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  if (!p) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains("modal-backdrop")) onClose(); }}>
      <div className="modal" style={{ "--accent": p.accent }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-left">
          <div className="proj-thumb-grid" style={{ position: "absolute", inset: 0 }} />
          <div className="proj-orb" style={{ width: "70%", height: "70%", left: "15%", top: "15%", filter: "blur(40px)", opacity: 0.85 }} />
          <div className="proj-thumb-rings" style={{ position: "absolute", inset: "20% 20%" }} />
          <div style={{
            position: "absolute", inset: 0, display: "grid", placeItems: "center",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 200, color: "rgba(255,255,255,0.05)"
          }}>{p.index}</div>
          <div style={{ position: "absolute", bottom: 18, left: 18, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.3em", color: "var(--ink-dim)" }}>
            PRJ_{p.index} · {p.tag}
          </div>
        </div>
        <div className="modal-right">
          <div className="modal-index">{p.tag} · {p.year}</div>
          <h2 className="modal-title">{t(p.title, lang)}</h2>
          <div className="modal-scope">{t(p.scope, lang)}</div>
          <p className="modal-body">{t(p.body, lang)}</p>
          <dl className="modal-meta">
            <div>
              <dt>{lang === "ko" ? "스택" : "STACK"}</dt>
              <dd>{p.stack.join(" · ")}</dd>
            </div>
            <div>
              <dt>{lang === "ko" ? "역할" : "ROLE"}</dt>
              <dd>{p.team ? lang === "ko" ? "팀 협업" : "Team" : lang === "ko" ? "개인 작업" : "Solo"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>);

}

function Projects({ lang }) {
  const p = DATA.projects;
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "all") return p.items;
    if (filter === "team") return p.items.filter((i) => i.team);
    return p.items.filter((i) => i.type === filter);
  }, [filter]);

  return (
    <section id="work">
      <Reveal className="section-head">
        <div className="eyebrow"><span className="id">03</span> / {lang === "ko" ? "작업" : "WORK"}</div>
        <h2 className="h-display">My Work.</h2>
        <p className="section-sub">{t(p.subtitle, lang)}</p>
      </Reveal>

      <div className="proj-filters">
        {p.filters.map((f) =>
          <button key={f.id} className={"proj-filter" + (filter === f.id ? " on" : "")} onClick={() => setFilter(f.id)}>
            {t(f.label, lang)}
          </button>
        )}
      </div>

      <div className="projects-grid">
        {filtered.map((it, i) => <ProjectCard key={it.id} p={it} lang={lang} onOpen={setOpen} idx={i} />)}
      </div>

      {open && <ProjectModal p={open} lang={lang} onClose={() => setOpen(null)} />}
    </section>);

}

// ============================================================
// Playground
// ============================================================
function Playground({ lang }) {
  const pg = DATA.playground;
  useEffect(() => {
    // double rAF to ensure canvases are sized
    requestAnimationFrame(() => requestAnimationFrame(() => initPlaygroundScenes()));
  }, []);
  return (
    <section id="playground">
      <Reveal className="section-head">
        <div className="eyebrow"><span className="id">04</span> / {lang === "ko" ? "실험실" : "LAB"}</div>
        <h2 className="h-display">Playground.</h2>
        <p className="section-sub">{t(pg.subtitle, lang)}</p>
      </Reveal>
      <div className="play-grid">
        {pg.items.map((it, i) =>
          <Reveal key={i} className="play-card" delay={i * 90}>
            <canvas id={`play-${i}`} className="play-canvas" />
            <div className="play-info">
              <div>
                <h4>{t(it.title, lang)}</h4>
                <p>{t(it.caption, lang)}</p>
              </div>
              <div className="play-num">0{i + 1}</div>
            </div>
          </Reveal>
        )}
      </div>
      <DotArtLab lang={lang} />
    </section>);

}

// ============================================================
// Contact + Footer
// ============================================================
function Contact({ lang }) {
  const c = DATA.contact;
  const m = DATA.meta;
  return (
    <section id="contact">
      <div className="section-head" style={{ textAlign: "center", alignItems: "center" }}>
        <div className="eyebrow" style={{ alignSelf: "center" }}><span className="id">05</span> / {lang === "ko" ? "연락" : "CONTACT"}</div>
      </div>
      <Reveal className="contact-wrap">
        <h2 className="contact-title">{c.title.en}</h2>
        <p className="contact-sub">{t(c.subtitle, lang)}</p>
        <div className="contact-actions">
          <a className="cta-primary" href={`mailto:${m.email}`}>
            {t(c.cta, lang)}
            <span className="arrow">→</span>
          </a>
        </div>
        <div className="socials">
          <a className="social-pill" href={`mailto:${m.email}`}>✉ {m.email}</a>
          <a className="social-pill" href={`https://${m.instagram}`} target="_blank" rel="noreferrer">◇ INSTAGRAM</a>
          <a className="social-pill" href={`https://${m.github}`} target="_blank" rel="noreferrer">◎ GITHUB</a>
        </div>
      </Reveal>
    </section>);

}

function Footer() {
  return (
    <footer>
      <span>{DATA.footer.line1}</span>
      <span>{DATA.footer.line2}</span>
      <span>Seoul · KR · {new Date().getFullYear()}</span>
    </footer>);

}

// ============================================================
// App
// ============================================================

export default function App() {
  const [lang, setLang] = useState("ko");
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
    // notify the Three.js background to recolour
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const active = useScrollSpy(["home", "about", "timeline", "work", "playground", "contact"]);
  return (
    <>
      <Topbar lang={lang} setLang={setLang} theme={theme} onToggleTheme={toggleTheme} active={active} />
      <Hero lang={lang} />
      <About lang={lang} />
      <Timeline lang={lang} />
      <Projects lang={lang} />
      <Playground lang={lang} />
      <Contact lang={lang} />
      <Footer />
    </>);

}
