import React, { useEffect, useRef, useState, useCallback } from "react";
import type { HeroProps, SpringConfig } from "./types";
import {
  HeroScene,
  DEFAULT_PARAMS,
  fitSubjectToBox,
  ASSET_BASE_URL,
} from "./HeroScene";
import {
  SPRING_CONFIGS,
  stepSpringValue,
  setupWordReveal,
  setupLetterReveal,
  updateRevealUnits,
} from "./springs";
import "./Hero.css";

export const Hero: React.FC<HeroProps> = ({ onLoaded, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroSceneRef = useRef<HeroScene | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fitBoxRef = useRef<HTMLDivElement | null>(null);

  // UI Element Refs for Springs & Reveals
  const heroNameRef = useRef<HTMLHeadingElement | null>(null);
  const heroHeaderRef = useRef<HTMLElement | null>(null);
  const driverTagRef = useRef<HTMLDivElement | null>(null);
  const heroPanelsRef = useRef<HTMLDivElement | null>(null);
  const heroActionsRef = useRef<HTMLDivElement | null>(null);
  const stat1Ref = useRef<HTMLElement | null>(null);
  const stat2Ref = useRef<HTMLElement | null>(null);
  const stat3Ref = useRef<HTMLElement | null>(null);

  // Loading Veil Refs
  const veilRef = useRef<HTMLDivElement | null>(null);
  const veilFillRef = useRef<HTMLDivElement | null>(null);
  const veilMeterRef = useRef<HTMLDivElement | null>(null);
  const veilNameRef = useRef<HTMLDivElement | null>(null);

  // Mobile Sheet State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [veilRemoved, setVeilRemoved] = useState(false);

  // Texture and critical asset preloading for peak performance
  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];

    const addPreload = (href: string, asType: string, type?: string) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = href;
      link.as = asType;
      if (type) link.type = type;
      link.setAttribute("fetchpriority", "high");
      document.head.appendChild(link);
      preloadLinks.push(link);
    };

    // Preload critical hero portrait and 3D maps
    addPreload(`${ASSET_BASE_URL}hero/scene/person-diffuse.webp`, "image", "image/webp");
    addPreload(`${ASSET_BASE_URL}hero/scene/person-depth.webp`, "image", "image/webp");
    addPreload(`${ASSET_BASE_URL}hero/scene/noise.webp`, "image", "image/webp");
    addPreload(`${ASSET_BASE_URL}hero/scene/helmet3.glb`, "fetch");

    return () => {
      preloadLinks.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, []);

  // Responsive fit and parameters calculation
  const applyHeroFit = useCallback(() => {
    const scene = heroSceneRef.current;
    const canvas = canvasRef.current;
    const fitBox = fitBoxRef.current;
    const section = containerRef.current;
    if (!scene || !canvas || !section) return;

    const s = section.getBoundingClientRect();
    const b = fitBox && fitBox.offsetParent !== null ? fitBox.getBoundingClientRect() : s;
    const container = canvas.parentElement;
    const containerHeight = container ? container.clientHeight : s.height;

    const params = {
      ...DEFAULT_PARAMS,
      ...(fitBox && fitBox.offsetParent !== null
        ? fitSubjectToBox(
            DEFAULT_PARAMS,
            { top: b.top - s.top, height: b.height },
            containerHeight
          )
        : {}),
      ...(window.matchMedia("(max-width: 1023px)").matches
        ? { bgRevealOpacity: 0 }
        : {}),
      ...(window.matchMedia("(hover: none)").matches
        ? { autoSweepAmount: 0.76 }
        : {}),
      ...(window.matchMedia("(max-width: 639px)").matches
        ? { sweepRadius: 0.95, sweepWarp: 0.18, autoSweepAmount: 0.55 }
        : {}),
      ...(scene.tier && !scene.tier.reveal ? { autoSweepAmount: 0 } : {}),
    };

    scene.setParams(params);
  }, []);

  // WebGL Scene Lifecycle and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: HeroScene | null = null;
    let animRaf: number | null = null;
    let lastTime = performance.now();
    let isVisible = true;

    // Veil State
    const veilProgress = { value: 0, velocity: 0, atRest: false };
    let veilTarget = 0.7;
    let veilConfig: SpringConfig = SPRING_CONFIGS.PROGRESS_WAITING;
    let veilSceneReady = false;
    const veilStartTime = performance.now();
    let veilClearTime: number | null = null;
    let veilLiftTime: number | null = null;
    let handoverTime: number | null = null;
    const veilNameState = { value: 0, velocity: 0, atRest: false };

    // UI Springs
    const driverTagSpring = { value: 0, velocity: 0, atRest: false };
    const metaSprings: { value: number; velocity: number; atRest: boolean }[] = [];
    const panelsSpring = { value: 0, velocity: 0, atRest: false };
    const actionsSpring = { value: 0, velocity: 0, atRest: false };

    // Word and Letter reveals
    let heroNameUnits: ReturnType<typeof setupWordReveal> = [];
    let stat1Units: ReturnType<typeof setupLetterReveal> = [];
    let stat2Units: ReturnType<typeof setupLetterReveal> = [];
    let stat3Units: ReturnType<typeof setupLetterReveal> = [];

    if (heroNameRef.current) {
      heroNameUnits = setupWordReveal(
        heroNameRef.current,
        "kimi antonelli",
        180,
        110
      );
    }
    if (stat1Ref.current) {
      stat1Units = setupLetterReveal(stat1Ref.current, "12", 0, 26);
    }
    if (stat2Ref.current) {
      stat2Units = setupLetterReveal(stat2Ref.current, "3", 90, 26);
    }
    if (stat3Ref.current) {
      stat3Units = setupLetterReveal(stat3Ref.current, "118", 180, 26);
    }

    const metaItems = containerRef.current?.querySelectorAll(".hero-meta-item");
    if (metaItems) {
      metaItems.forEach(() => {
        metaSprings.push({ value: 0, velocity: 0, atRest: false });
      });
    }

    try {
      scene = new HeroScene(canvas);
      heroSceneRef.current = scene;

      scene.onReady = () => {
        veilSceneReady = true;
        veilTarget = 1.0;
        veilConfig = SPRING_CONFIGS.PROGRESS_READY;
        onLoaded?.();
      };
    } catch (e) {
      console.warn("HeroScene init fallback:", e);
      veilSceneReady = true;
      veilTarget = 1.0;
      veilConfig = SPRING_CONFIGS.PROGRESS_READY;
      onLoaded?.();
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas || !scene) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      scene.resize(w, h);
      scene.retune();
      applyHeroFit();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Pointer move listener
    const handlePointerMove = (e: PointerEvent) => {
      if (scene && scene.tier.pointerEnabled) {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        scene.setPointer(x, y);
      }
    };
    window.addEventListener("pointermove", handlePointerMove);

    // Visibility Observer to pause rendering when out of viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    // Ticker Loop
    const tick = (now: number) => {
      const dtMs = now - lastTime;
      lastTime = now;

      // 1. Loading Veil update
      const veilEl = veilRef.current;
      const veilFill = veilFillRef.current;
      const veilMeter = veilMeterRef.current;
      const veilName = veilNameRef.current;

      if (veilEl && veilFill && veilMeter && veilName) {
        const elapsed = now - veilStartTime;

        stepSpringValue(veilProgress, veilTarget, veilConfig, dtMs);
        const prog = veilProgress.value;
        veilFill.style.transform = `scaleY(${prog.toFixed(4)})`;
        veilMeter.style.transform = `scaleX(${prog.toFixed(4)})`;

        if (elapsed >= 260) {
          stepSpringValue(veilNameState, 1, { tension: 110, friction: 26 }, dtMs);
          veilName.style.opacity = veilNameState.value.toFixed(4);
          veilName.style.transform = `translateY(${((1 - veilNameState.value) * 0.6).toFixed(4)}rem)`;
        }

        if (veilSceneReady && veilClearTime === null) {
          veilClearTime = now;
        }

        if (veilClearTime !== null) {
          const clearAge = now - veilClearTime;
          const clearProg = Math.min(1, clearAge / 430);
          if (veilFill.parentElement) {
            veilFill.parentElement.style.opacity = (1 - clearProg).toFixed(4);
            veilFill.parentElement.style.transform = `translateY(${(-0.75 * clearProg).toFixed(4)}rem)`;
          }
          veilName.style.opacity = (1 - clearProg).toFixed(4);
          if (veilMeter.parentElement) {
            veilMeter.parentElement.style.opacity = (1 - clearProg).toFixed(4);
          }

          if (clearAge >= 430 + 240 && veilLiftTime === null) {
            veilLiftTime = now;
            handoverTime = now;
            scene?.beginRise();
          }
        }

        if (veilLiftTime !== null) {
          const liftAge = now - veilLiftTime;
          const liftProg = Math.min(1, liftAge / 700);
          const currentOpacity = 1 - liftProg;
          veilEl.style.opacity = currentOpacity.toFixed(4);
          veilEl.style.pointerEvents = "none";

          if (currentOpacity <= 0.004 || liftAge > 3000) {
            setVeilRemoved(true);
          }
        }
      }

      // 2. WebGL 3D Scene update (culled when off-screen)
      if (scene && isVisible) {
        scene.update(now);
      }

      // 3. Hero UI springs update
      if (handoverTime !== null) {
        const elapsed = now - handoverTime;

        if (heroHeaderRef.current) {
          heroHeaderRef.current.style.opacity = "1";
        }

        if (driverTagRef.current && elapsed >= 180) {
          stepSpringValue(driverTagSpring, 1, SPRING_CONFIGS.REVEAL, dtMs);
          driverTagRef.current.style.opacity = driverTagSpring.value.toFixed(4);
        }

        if (heroNameUnits.length) {
          updateRevealUnits(heroNameUnits, elapsed, dtMs, SPRING_CONFIGS.REVEAL, 0.35);
        }

        if (metaItems && metaSprings.length) {
          metaSprings.forEach((st, i) => {
            const delay = 180 + 260 + i * 130;
            if (elapsed >= delay) {
              stepSpringValue(st, 1, SPRING_CONFIGS.ITEM, dtMs);
              const p = st.value;
              const el = metaItems[i] as HTMLElement;
              if (el) {
                el.style.opacity = p.toFixed(4);
                el.style.transform = `translateY(${((1 - p) * 0.75).toFixed(4)}rem)`;
              }
            }
          });
        }

        if (heroPanelsRef.current && elapsed >= 900) {
          stepSpringValue(panelsSpring, 1, SPRING_CONFIGS.REVEAL, dtMs);
          const p = panelsSpring.value;
          heroPanelsRef.current.style.opacity = p.toFixed(4);
          heroPanelsRef.current.style.transform = `translateY(${((1 - p) * 1.25).toFixed(4)}rem)`;

          const figAge = elapsed - 900;
          if (stat1Units.length) updateRevealUnits(stat1Units, figAge, dtMs, SPRING_CONFIGS.FIGURE, 0.3);
          if (stat2Units.length) updateRevealUnits(stat2Units, figAge, dtMs, SPRING_CONFIGS.FIGURE, 0.3);
          if (stat3Units.length) updateRevealUnits(stat3Units, figAge, dtMs, SPRING_CONFIGS.FIGURE, 0.3);
        }

        if (heroActionsRef.current && elapsed >= 1500) {
          stepSpringValue(actionsSpring, 1, SPRING_CONFIGS.REVEAL, dtMs);
          const p = actionsSpring.value;
          heroActionsRef.current.style.opacity = p.toFixed(4);
          heroActionsRef.current.style.transform = `translateY(${((1 - p) * 1.25).toFixed(4)}rem)`;
        }
      }

      animRaf = requestAnimationFrame(tick);
    };

    animRaf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      if (animRaf) cancelAnimationFrame(animRaf);
      observer.disconnect();
      if (scene) scene.dispose();
      heroSceneRef.current = null;
    };
  }, [applyHeroFit, onLoaded]);

  // Handle Escape key to close mobile navigation sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* LOADING VEIL */}
      {!veilRemoved && (
        <div
          ref={veilRef}
          className="loading-veil"
          role="status"
          aria-live="polite"
          aria-label="Loading racing system"
        >
          <div className="veil-center">
            <div
              className="veil-helmet-box"
              style={{
                maskImage: `url(${ASSET_BASE_URL}hero/ui/helmet-mask.png)`,
                WebkitMaskImage: `url(${ASSET_BASE_URL}hero/ui/helmet-mask.png)`,
              }}
            >
              <div className="veil-helmet-bg" />
              <div ref={veilFillRef} className="veil-helmet-fill" />
            </div>
            <div ref={veilNameRef} className="veil-title">
              kimi antonelli
            </div>
          </div>
          <div className="veil-meter-track">
            <div ref={veilMeterRef} className="veil-meter-fill" />
          </div>
        </div>
      )}

      {/* MOBILE SHEET MENU */}
      <div
        className="mobile-sheet"
        style={{ display: mobileMenuOpen ? "flex" : "none" }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="sheet-top">
          <img
            src={`${ASSET_BASE_URL}hero/ui/grido1-logo.webp`}
            alt="Grido1 Racing Systems"
            className="hero-logo"
            onClick={() => setMobileMenuOpen(false)}
            style={{ cursor: "pointer" }}
          />
          <button
            type="button"
            className="sheet-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
        </div>
        <ul className="sheet-nav">
          <li>
            <a href="/driver" onClick={() => setMobileMenuOpen(false)}>
              Driver
            </a>
          </li>
          <li>
            <a href="/season" onClick={() => setMobileMenuOpen(false)}>
              Season
            </a>
          </li>
          <li>
            <a href="/journal" onClick={() => setMobileMenuOpen(false)}>
              Journal
            </a>
          </li>
          <li>
            <a href="/next-race" onClick={() => setMobileMenuOpen(false)}>
              Next Race
            </a>
          </li>
          <li>
            <a href="/store" onClick={() => setMobileMenuOpen(false)}>
              Store
            </a>
          </li>
          <li>
            <a href="/garage" onClick={() => setMobileMenuOpen(false)}>
              Garage
            </a>
          </li>
        </ul>
      </div>

      {/* MAIN HERO SECTION */}
      <section ref={containerRef} data-hero className={className}>
        {/* Three.js Canvas */}
        <div className="hero-canvas-wrap">
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>

        {/* Shading ramp below 1280px */}
        <div className="hero-copy-ramp" />

        {/* Fit box measurement element */}
        <div ref={fitBoxRef} className="hero-fit-box" />

        <div className="hero-content">
          {/* Masthead */}
          <header ref={heroHeaderRef} className="hero-header">
            <a href="/" aria-label="Grido1 Racing Systems">
              <img
                src={`${ASSET_BASE_URL}hero/ui/grido1-logo.webp`}
                alt="Grido1 Racing Systems"
                className="hero-logo"
                width={424}
                height={97}
              />
            </a>

            <nav aria-label="Primary" className="hero-nav">
              <ul>
                <li>
                  <a href="/driver">Driver</a>
                </li>
                <li>
                  <a href="/season">Season</a>
                </li>
                <li>
                  <a href="/journal">Journal</a>
                </li>
                <li>
                  <a href="/next-race">Next Race</a>
                </li>
                <li>
                  <a href="/store">Store</a>
                </li>
              </ul>
            </nav>

            <a href="/garage" className="hero-garage-link">
              <span aria-hidden="true">[ </span>Garage
              <span aria-hidden="true"> → ]</span>
            </a>

            <button
              type="button"
              className="hero-burger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <span />
              <span />
            </button>
          </header>

          {/* Middle Row: Identity and Bracket Panels */}
          <div className="hero-middle">
            <div className="hero-identity">
              <div ref={driverTagRef} className="driver-tag">
                driver_012
              </div>

              <h1 ref={heroNameRef} className="hero-name">
                <span className="sr-only">kimi antonelli</span>
              </h1>

              <ul className="hero-meta-list">
                <li className="hero-meta-item">
                  <img
                    src={`${ASSET_BASE_URL}hero/ui/flag-italy.webp`}
                    alt="Italy"
                    style={{ width: "1.125rem", height: "0.75rem" }}
                  />
                  <span>Italy</span>
                </li>
                <li className="hero-meta-item">
                  <img
                    src={`${ASSET_BASE_URL}hero/ui/icon-rookie.svg`}
                    alt=""
                    aria-hidden="true"
                    style={{ width: "1rem", height: "1rem" }}
                  />
                  <span>rookie season_2026</span>
                </li>
                <li className="hero-meta-item">
                  <img
                    src={`${ASSET_BASE_URL}hero/ui/mercedes-logo.webp`}
                    alt=""
                    aria-hidden="true"
                    style={{ width: "0.875rem", height: "0.875rem" }}
                  />
                  <span>Mercedes-AMG F1 Team</span>
                </li>
              </ul>
            </div>

            <div ref={heroPanelsRef} data-hero-panels>
              {/* Panel 1: Next Race */}
              <div className="bracket-panel">
                <svg className="bracket-corner tr" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>
                <svg className="bracket-corner tl" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>
                <svg className="bracket-corner bl" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>
                <svg className="bracket-corner br" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>

                <div className="panel-eyebrow">next race</div>
                <dl className="panel-body-list">
                  <dt>belgian gp</dt>
                  <dd>spa-francorchamps</dd>
                  <dd>
                    <time dateTime="2026-07-27">27 jul 2026</time>
                  </dd>
                </dl>
                <img
                  src={`${ASSET_BASE_URL}hero/ui/circuit-spa.webp`}
                  alt="Spa-Francorchamps circuit layout"
                  className="circuit-map-img"
                  width={312}
                  height={199}
                  loading="lazy"
                />
              </div>

              {/* Panel 2: Season Stats */}
              <div className="bracket-panel">
                <svg className="bracket-corner tr" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>
                <svg className="bracket-corner tl" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>
                <svg className="bracket-corner bl" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>
                <svg className="bracket-corner br" viewBox="0 0 10.5 10.5">
                  <path d="M0 0.5H10V10.5" />
                </svg>

                <div className="panel-eyebrow">Season stats</div>
                <dl data-hero-stats>
                  <div className="stat-cell">
                    <dt className="stat-label">Races</dt>
                    <dd ref={stat1Ref} className="stat-figure" />
                  </div>
                  <div className="stat-cell">
                    <dt className="stat-label">Podiums</dt>
                    <dd ref={stat2Ref} className="stat-figure" />
                  </div>
                  <div className="stat-cell">
                    <dt className="stat-label">Points</dt>
                    <dd ref={stat3Ref} className="stat-figure" />
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Foot Actions */}
          <div ref={heroActionsRef} className="hero-actions">
            <a href="/trailer" className="trailer-cta">
              <img
                src={`${ASSET_BASE_URL}hero/ui/play-button.svg`}
                alt=""
                className="trailer-icon"
                width={32}
                height={32}
              />
              <div className="trailer-text">
                <span className="trailer-label">watch trailer</span>
                <span className="trailer-time">01:26</span>
              </div>
            </a>

            <a href="/driver/kimi-antonelli" className="profile-cta">
              <svg className="frame-svg" viewBox="0 0 220 50" preserveAspectRatio="none">
                <path d="M220 42L212.932 50H0V0H220V42Z" fill="#0E0F14" />
                <path className="cta-flood" d="M220 42L212.932 50H0V0H220V42Z" fill="var(--accent, #02d2e3)" />
                <path d="M220 42L212.932 50H0V0H220V42Z" fill="none" stroke="var(--accent, #02d2e3)" strokeOpacity="0.25" />
                <path d="M205 49.5H213L219.5 42V36 M212 0.5H219.5V7 M8 0.5H0.5V7 M7.5 49.5H0.5V42.5" fill="none" stroke="var(--accent, #02d2e3)" />
              </svg>
              <span className="cta-label">view profile</span>
              <svg className="cta-arrow" viewBox="0 0 13.7071 10.7071">
                <path d="M0 5.35355H13M8 10.3536L13 5.35355L8 0.353553" />
              </svg>
            </a>

            <ul className="hero-socials">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  inst
                </a>
              </li>
              <li>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer">
                  x
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  youtube
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
