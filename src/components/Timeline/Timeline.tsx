import React, { useEffect, useRef, useState } from "react";
import { ChequeredSeam } from "../common/ChequeredSeam";
import {
  PLATE_OUTLINE,
  PLATE_CLIP,
  TIMELINE_DATA,
  type TimelineItem,
} from "./timelineData";
import "./Timeline.css";

const ASSET_BASE_URL = "https://storage.getlayers.ai/assets/kimi-04a9449ab2/timeline/";

export const Timeline: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const railSvgRef = useRef<SVGSVGElement>(null);
  const railLineRef = useRef<SVGRectElement>(null);
  const railMarkerRef = useRef<SVGRectElement>(null);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parallax and scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;

      // 1. Central Rail Progress & Spinning Marker
      if (railSvgRef.current && railLineRef.current && railMarkerRef.current) {
        const railRect = railSvgRef.current.getBoundingClientRect();
        const start = railRect.top - vh / 2;
        const end = railRect.bottom - vh;
        const length = Math.abs(start - end);
        const progress = Math.min(1, Math.max(0, 1 - (start + length) / length));

        const rest = 2150;
        const run = progress * rest;
        railLineRef.current.setAttribute("height", run.toFixed(1));
        const rotation = (run / rest) * 1800; // 5 full turns
        railMarkerRef.current.setAttribute(
          "transform",
          `translate(8, ${run}) rotate(${rotation})`
        );
      }

      // 2. Row Parallax and Photo Slot Scrub
      const rows = sectionRef.current?.querySelectorAll<HTMLElement>(".timeline-row");
      rows?.forEach((row, idx) => {
        const item = TIMELINE_DATA[idx];
        const rect = row.getBoundingClientRect();
        const rProgress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        const excursion = (rProgress - 0.5) * 2; // -1 to 1

        const plateParallax = item.frame === "side" ? 60 : 20;
        const copyParallax = 110;

        const plateWrap = row.querySelector<HTMLElement>(".timeline-plate-wrap");
        if (plateWrap) {
          const yOff = (-excursion * (plateParallax / 1440) * 100).toFixed(4);
          plateWrap.style.transform =
            item.frame === "centre"
              ? `translateX(-50%) translateY(${yOff}cqw)`
              : `translateY(${yOff}cqw)`;
        }

        const copyEl = row.querySelector<HTMLElement>(".timeline-copy");
        if (copyEl) {
          copyEl.style.top = `calc(50% + ${(-excursion * (copyParallax / 1440) * 100).toFixed(4)}cqw)`;
        }

        const slotEl = row.querySelector<HTMLElement>(".plate-slot");
        if (slotEl) {
          slotEl.style.transform = `scale(1.04) translateY(${(-3 + rProgress * 6).toFixed(2)}%)`;
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section data-timeline id="timeline-section" ref={sectionRef}>
      {/* SVG Clip Path Definition */}
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <clipPath id="timeline-plate-clip" clipPathUnits="objectBoundingBox">
            <path d={PLATE_CLIP} />
          </clipPath>
        </defs>
      </svg>


      <div className="timeline-wrap" id="timeline-wrap">
        <h2 className="timeline-h2" id="timeline-h2">
          <span>FROM KARTS</span>
          <span>
            <span>TO F1</span>
            <span style={{ color: "var(--foreground-on-dark)" }}>.</span>
          </span>
        </h2>

        {/* Center Rail */}
        <div className="timeline-rail" id="timeline-rail">
          <svg
            ref={railSvgRef}
            id="rail-svg"
            viewBox="0 0 16 2700"
            preserveAspectRatio="none"
          >
            <line
              x1="8"
              y1="0"
              x2="8"
              y2="98"
              stroke="var(--timeline-rail)"
              strokeWidth="1"
            />
            <line
              id="rail-dashed-track"
              x1="8"
              y1="102"
              x2="8"
              y2="2400"
              stroke="var(--timeline-rail)"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <rect
              ref={railLineRef}
              id="rail-progress-line"
              x="7.5"
              y="0"
              width="1"
              height="0"
              fill="var(--foreground-on-dark)"
            />
            <rect
              ref={railMarkerRef}
              id="rail-marker-square"
              x="-4.5"
              y="-4.5"
              width="9"
              height="9"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* 7 Career Rows */}
        <div id="timeline-rows-container">
          {TIMELINE_DATA.map((item: TimelineItem, index: number) => {
            const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
            const isCentre = item.frame === "centre";

            return (
              <div
                key={item.year}
                className={`timeline-row ${isCentre ? "centre-row" : "side-row"} ${isDimmed ? "dimmed" : ""}`}
                data-index={index}
                style={{
                  height: isCentre ? "32.0833cqw" : "15.0694cqw",
                }}
              >
                {/* Plate Wrapper */}
                <div
                  className="timeline-plate-wrap"
                  style={{
                    width: isCentre ? "49.3056cqw" : "23.1250cqw",
                    left: isCentre
                      ? "50%"
                      : item.align === "left"
                      ? "max(2.2222cqw, var(--gutter-min, 0px))"
                      : undefined,
                    right:
                      !isCentre && item.align === "right"
                        ? "max(2.2222cqw, var(--gutter-min, 0px))"
                        : undefined,
                    transform: isCentre ? "translateX(-50%)" : undefined,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className="plate-inner"
                    style={{
                      clipPath: "url(#timeline-plate-clip)",
                      WebkitClipPath: "url(#timeline-plate-clip)",
                    }}
                  >
                    <div className="plate-slot">
                      <img
                        src={`${ASSET_BASE_URL}${item.year}.webp`}
                        alt={`Kimi Antonelli in ${item.year}`}
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  </div>
                  <svg
                    className="plate-outline-svg"
                    viewBox="0 0 710.995 462.995"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={PLATE_OUTLINE}
                      fill="none"
                      stroke="var(--timeline-outline, #535450)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* Year Marker */}
                <div
                  className="timeline-year"
                  style={{
                    opacity: isCentre ? 0.4 : 1,
                  }}
                >
                  {item.year}
                </div>

                {/* Copy for Centre Rows */}
                {isCentre && item.copy && (
                  <p className="timeline-copy">
                    <strong>{item.copy}</strong> {item.desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
