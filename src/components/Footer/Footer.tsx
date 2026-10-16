import React, { useEffect, useRef } from "react";
import { ContourCanvas } from "../common/ContourCanvas";
import "./Footer.css";

const ASSET_BASE = "https://storage.getlayers.ai/assets/kimi-04a9449ab2/footer/";

export const Footer: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !parallaxRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      parallaxRef.current.style.transform = `translateY(${((1 - progress) * 4.1667).toFixed(4)}cqw)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section data-footer id="footer-section" ref={sectionRef}>
      <div className="footer-inner-panel">
        {/* Procedural 2D marching squares contour canvas (white at 10%) */}
        <ContourCanvas strokeColor="rgb(255 255 255 / 0.1)" className="footer-canvas" />

        {/* Masked Grid01 logo */}
        <div
          className="footer-logo"
          id="footer-logo"
          style={{
            maskImage: `url(${ASSET_BASE}logo-mask.png)`,
            WebkitMaskImage: `url(${ASSET_BASE}logo-mask.png)`,
          }}
          role="img"
          aria-label="GRID01 Racing Systems"
        />

        {/* Masthead */}
        <h2 className="footer-h2" id="footer-h2">
          <span>KEEP PUSHING</span>
          <span>
            FORWARD
            <span style={{ color: "var(--foreground-on-dark)" }}>.</span>
          </span>
        </h2>

        {/* Navigation column */}
        <ul className="footer-nav" id="footer-nav-list">
          <li>
            <a href="#driver" className="foot-nav-link" data-label="DRIVER">
              DRIVER
            </a>
          </li>
          <li>
            <a href="#season" className="foot-nav-link" data-label="SEASON">
              SEASON
            </a>
          </li>
          <li>
            <a href="#journal" className="foot-nav-link" data-label="JOURNAL">
              JOURNAL
            </a>
          </li>
          <li>
            <a href="#next-race" className="foot-nav-link" data-label="NEXT RACE">
              NEXT RACE
            </a>
          </li>
          <li>
            <a href="#store" className="foot-nav-link" data-label="STORE">
              STORE
            </a>
          </li>
        </ul>

        {/* Foot Row */}
        <div className="footer-foot-row" id="footer-foot-row">
          <div className="footer-copy">
            © 2026 GRID01 Racing Systems. All rights reserved.
          </div>

          <a href="#legal" className="footer-cta">
            <svg
              className="footer-cta-frame"
              viewBox="0 0 275 50"
              preserveAspectRatio="none"
            >
              <path
                d="M0.5 0.5H274.5V41.165L266.165 49.5H0.5Z"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="footer-cta-flood"
                d="M0.5 0.5H274.5V41.165L266.165 49.5H0.5Z"
                fill="var(--accent)"
              />
            </svg>
            <div className="footer-cta-content">
              <span>legal documents</span>
              <svg className="footer-cta-arrow" viewBox="0 0 13.7071 10.7071">
                <path d="M0 5.35H13M8 10.35L13 5.35L8 0.35" />
              </svg>
            </div>
          </a>

          <ul className="footer-socials">
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

      {/* Figure Group (Suit + Helmet Parallax) */}
      <div className="footer-figure-group" id="footer-figure-group">
        <div className="footer-figure-parallax" ref={parallaxRef}>
          <img
            src={`${ASSET_BASE}body.webp`}
            alt=""
            className="footer-body-img"
            loading="eager"
            decoding="async"
          />
          <img
            src={`${ASSET_BASE}helmet.webp`}
            alt="Kimi Antonelli's helmet"
            className="footer-helmet-img"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};
