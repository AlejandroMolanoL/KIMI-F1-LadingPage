import React, { useEffect, useRef, useState } from "react";
import { ContourCanvas } from "../common/ContourCanvas";
import { ChequeredSeam } from "../common/ChequeredSeam";
import "./Paddock.css";

const ASSET_BASE = "https://storage.getlayers.ai/assets/kimi-04a9449ab2/paddock/";

export const Paddock: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  const [bracketHover, setBracketHover] = useState(false);

  useEffect(() => {
    // 1. Portrait Parallax on Scroll
    const handleScroll = () => {
      if (!sectionRef.current || !portraitRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      portraitRef.current.style.transform = `translateX(-50%) translateY(${(-progress * 4).toFixed(4)}cqw)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // 2. Calendar Live Connectors Crawl & Live Pulse
    let rafId: number;
    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);

      // Crawl connectors (5200ms linear loop of 11.45px)
      const crawlOffset = ((now / 5200) * 11.45) % 11.45;
      const conn0 = document.getElementById("cal-conn-0");
      const conn1 = document.getElementById("cal-conn-1");
      const conn2 = document.getElementById("cal-conn-2");
      const conn3 = document.getElementById("cal-conn-3");
      if (conn0) conn0.style.backgroundPositionX = `${crawlOffset.toFixed(2)}px`;
      if (conn1) conn1.style.backgroundPositionX = `${crawlOffset.toFixed(2)}px`;
      if (conn2) conn2.style.backgroundPositionX = `${(-crawlOffset).toFixed(2)}px`;
      if (conn3) conn3.style.backgroundPositionX = `${(-crawlOffset).toFixed(2)}px`;

      // Live pulse (3200ms)
      const pv = (now % 3200) / 3200;
      const pr = 5.5 + pv * 5.5 * 3.4;
      const popacity = 0.5 * (1 - pv) * (1 - pv);
      if (pulseRef.current) {
        pulseRef.current.style.width = `${(pr * 2).toFixed(2)}px`;
        pulseRef.current.style.height = `${(pr * 2).toFixed(2)}px`;
        pulseRef.current.style.left = `${(5.5 - pr).toFixed(2)}px`;
        pulseRef.current.style.top = `${(5.5 - pr).toFixed(2)}px`;
        pulseRef.current.style.opacity = popacity.toFixed(4);
      }
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section data-paddock id="paddock-section" ref={sectionRef}>
      {/* 2D Marching squares procedural contour canvas */}
      <ContourCanvas strokeColor="rgb(9 10 11 / 0.08)" className="paddock-canvas" />

      {/* Dark Band & Gradient */}
      <div className="paddock-band" />
      <div className="paddock-fade-grad" />

      {/* Parallax Portrait */}
      <img
        ref={portraitRef}
        src={`${ASSET_BASE}portrait.webp`}
        alt="Kimi Antonelli in the paddock"
        className="paddock-portrait"
        loading="eager"
        decoding="async"
      />

      {/* Chequered dissolve seam carrying dark ground */}
      <ChequeredSeam carry="dark" />

      {/* Intro Left Rail */}
      <h2 className="paddock-h2" id="paddock-h2">
        <span>FROM THE</span>
        <span>
          PADDOCK
          <span style={{ color: "var(--accent)" }}>.</span>
        </span>
      </h2>

      <div className="paddock-intro-col">
        <p className="paddock-report" id="paddock-report">
          A composed drive through a difficult weekend secured another podium —
          and kept Kimi at the top of the championship.
        </p>

        <a href="#hungarian-gp" className="paddock-btn" id="paddock-cta">
          <svg className="paddock-btn-frame" viewBox="0 0 217 50" preserveAspectRatio="none">
            <path
              d="M0.5 0.5H216.5V42L209 49.5H0.5Z"
              fill="var(--surface-black)"
              stroke="var(--accent)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="paddock-btn-flood"
              d="M0.5 0.5H216.5V42L209 49.5H0.5Z"
              fill="var(--accent)"
            />
          </svg>
          <div className="paddock-btn-content">
            <span>read story</span>
            <svg className="paddock-btn-arrow" viewBox="0 0 13.7071 10.7071">
              <path d="M0 5.35H13M8 10.35L13 5.35L8 0.35" />
            </svg>
          </div>
        </a>
      </div>

      {/* Right Rail Panels */}
      <div className="paddock-panels" id="paddock-panels">
        {/* Meeting Panel */}
        <div className="paddock-panel-col paddock-meet bracket-panel">
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
          <dl className="panel-body-list" style={{ marginTop: 0 }}>
            <dt>hungarian gp</dt>
            <dd>silverstone</dd>
            <dd>july 12, 2026</dd>
          </dl>
        </div>

        {/* Stats Panel */}
        <div className="paddock-panel-col paddock-stats-panel bracket-panel">
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

          <div className="paddock-stat-row">
            <img
              src={`${ASSET_BASE}icon-flag.svg`}
              alt=""
              className="paddock-stat-icon"
            />
            <div className="paddock-stat-data">
              <span className="paddock-stat-label">last result</span>
              <span className="paddock-stat-num">P4</span>
            </div>
          </div>
          <div className="paddock-stat-divider" />

          <div className="paddock-stat-row">
            <img
              src={`${ASSET_BASE}icon-bars.svg`}
              alt=""
              className="paddock-stat-icon"
            />
            <div className="paddock-stat-data">
              <span className="paddock-stat-label">points gained</span>
              <span className="paddock-stat-num">+12</span>
            </div>
          </div>
          <div className="paddock-stat-divider" />

          <div className="paddock-stat-row">
            <img
              src={`${ASSET_BASE}icon-trophy.svg`}
              alt=""
              className="paddock-stat-icon"
            />
            <div className="paddock-stat-data">
              <span className="paddock-stat-label">championship</span>
              <span className="paddock-stat-num">P1</span>
            </div>
          </div>
          <div className="paddock-stat-divider" />

          <div className="paddock-stat-row">
            <img
              src={`${ASSET_BASE}icon-gauge.svg`}
              alt=""
              className="paddock-stat-icon"
            />
            <div className="paddock-stat-data">
              <span className="paddock-stat-label">points</span>
              <span className="paddock-stat-num">118</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="calendar-strip" id="calendar-strip">
        {/* 4 Connectors */}
        <div
          className="calendar-connector"
          id="cal-conn-0"
          style={{ left: "calc(50% - 340px + 14px)", width: "142px" }}
        />
        <div
          className="calendar-connector"
          id="cal-conn-1"
          style={{ left: "calc(50% - 170px + 14px)", width: "142px" }}
        />
        <div
          className="calendar-connector"
          id="cal-conn-2"
          style={{ left: "calc(50% + 14px)", width: "142px" }}
        />
        <div
          className="calendar-connector"
          id="cal-conn-3"
          style={{ left: "calc(50% + 170px + 14px)", width: "142px" }}
        />

        {/* 5 Cards */}
        {/* Round 11 */}
        <div
          className="calendar-card"
          id="cal-card-0"
          style={{ left: "calc(50% - 340px)" }}
        >
          <span className="cal-round">round 11</span>
          <span className="cal-name">austrian gp</span>
          <span className="cal-date">29 jun</span>
        </div>
        <div className="calendar-marker" style={{ left: "calc(50% - 340px)" }}>
          P6
        </div>

        {/* Round 12 */}
        <div
          className="calendar-card"
          id="cal-card-1"
          style={{ left: "calc(50% - 170px)" }}
        >
          <span className="cal-round">round 12</span>
          <span className="cal-name">british gp</span>
          <span className="cal-date">12 jul</span>
        </div>
        <div className="calendar-marker" style={{ left: "calc(50% - 170px)" }}>
          P4
        </div>

        {/* Round 13 (LIVE) */}
        <div
          className="calendar-card"
          id="cal-card-2"
          style={{ left: "50%" }}
          onMouseEnter={() => setBracketHover(true)}
          onMouseLeave={() => setBracketHover(false)}
        >
          <span className="cal-round live">round 13</span>
          <span className="cal-name">belgian gp</span>
          <span className="cal-date live">27 jul</span>
        </div>
        <div className="calendar-marker" style={{ left: "50%" }}>
          <svg width="11" height="11" viewBox="0 0 11 11">
            <circle cx="5.5" cy="5.5" r="5.5" fill="var(--accent)" />
          </svg>
          <div className="cal-live-pulse" ref={pulseRef} />
        </div>

        {/* Live Bracket */}
        <div
          className="cal-live-bracket bracket-panel"
          ref={bracketRef}
          style={{
            left: "50%",
            transform: bracketHover ? "translateX(-50%) scaleX(1.08)" : "translateX(-50%)",
            width: "130px",
          }}
        >
          <svg className="bracket-corner tr" viewBox="0 0 10.5 10.5" style={{ stroke: "var(--accent)" }}>
            <path d="M0 0.5H10V10.5" />
          </svg>
          <svg className="bracket-corner tl" viewBox="0 0 10.5 10.5" style={{ stroke: "var(--accent)" }}>
            <path d="M0 0.5H10V10.5" />
          </svg>
          <svg className="bracket-corner bl" viewBox="0 0 10.5 10.5" style={{ stroke: "var(--accent)" }}>
            <path d="M0 0.5H10V10.5" />
          </svg>
          <svg className="bracket-corner br" viewBox="0 0 10.5 10.5" style={{ stroke: "var(--accent)" }}>
            <path d="M0 0.5H10V10.5" />
          </svg>
        </div>

        {/* Round 14 */}
        <div
          className="calendar-card"
          id="cal-card-3"
          style={{ left: "calc(50% + 170px)" }}
        >
          <span className="cal-round">round 14</span>
          <span className="cal-name">hungarian gp</span>
          <span className="cal-date">03 aug</span>
        </div>
        <div className="calendar-marker" style={{ left: "calc(50% + 170px)" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--foreground-on-dark)" strokeWidth="1">
            <circle cx="5.5" cy="5.5" r="5" />
          </svg>
        </div>

        {/* Round 15 */}
        <div
          className="calendar-card"
          id="cal-card-4"
          style={{ left: "calc(50% + 340px)" }}
        >
          <span className="cal-round">round 15</span>
          <span className="cal-name">dutch gp</span>
          <span className="cal-date">31 aug</span>
        </div>
        <div className="calendar-marker" style={{ left: "calc(50% + 340px)" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--foreground-on-dark)" strokeWidth="1">
            <circle cx="5.5" cy="5.5" r="5" />
          </svg>
        </div>
      </div>
    </section>
  );
};
