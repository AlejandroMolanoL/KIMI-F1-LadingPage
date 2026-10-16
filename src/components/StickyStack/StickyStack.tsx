import React, { useEffect, useRef } from "react";
import "./StickyStack.css";

interface StickyStackProps {
  hero: React.ReactNode;
  season: React.ReactNode;
  timeline: React.ReactNode;
}

const RECEDE_SCALE = 1.0;
const RECEDE_SHADE = 0.55;

export const StickyStack: React.FC<StickyStackProps> = ({
  hero,
  season,
  timeline,
}) => {
  const innerHeroRef = useRef<HTMLDivElement>(null);
  const shadeHeroRef = useRef<HTMLDivElement>(null);
  const layerSeasonRef = useRef<HTMLDivElement>(null);

  const innerSeasonRef = useRef<HTMLDivElement>(null);
  const shadeSeasonRef = useRef<HTMLDivElement>(null);
  const layerTimelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const phoneQuery = window.matchMedia("(max-width: 639px)");

    const onScroll = () => {
      const view = window.innerHeight || 1;
      const shrink = phoneQuery.matches ? 0 : 1 - RECEDE_SCALE;

      // 1. Hero recedes under Season
      if (innerHeroRef.current && shadeHeroRef.current && layerSeasonRef.current) {
        const top = layerSeasonRef.current.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, 1 - top / view));
        innerHeroRef.current.style.transform =
          p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : "";
        innerHeroRef.current.style.willChange =
          p > 0 && shrink > 0 ? "transform" : "";
        shadeHeroRef.current.style.opacity = `${RECEDE_SHADE * p}`;
        innerHeroRef.current.style.visibility = p >= 1 ? "hidden" : "visible";
      }

      // 2. Season recedes under Timeline
      if (
        innerSeasonRef.current &&
        shadeSeasonRef.current &&
        layerTimelineRef.current
      ) {
        const top = layerTimelineRef.current.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, 1 - top / view));
        innerSeasonRef.current.style.transform =
          p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : "";
        innerSeasonRef.current.style.willChange =
          p > 0 && shrink > 0 ? "transform" : "";
        shadeSeasonRef.current.style.opacity = `${RECEDE_SHADE * p}`;
        innerSeasonRef.current.style.visibility = p >= 1 ? "hidden" : "visible";
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="stack-viewport">
      {/* LAYER 1: HERO */}
      <div className="stack-layer stack-layer-hero" id="layer-hero">
        <div className="stack-layer-inner" ref={innerHeroRef} id="inner-hero">
          {hero}
        </div>
        <div className="stack-shade" ref={shadeHeroRef} id="shade-hero" />
      </div>

      {/* LAYER 2: SEASON */}
      <div
        className="stack-layer stack-layer-season"
        ref={layerSeasonRef}
        id="layer-season"
      >
        <div className="stack-layer-inner" ref={innerSeasonRef} id="inner-season">
          {season}
        </div>
        <div className="stack-shade" ref={shadeSeasonRef} id="shade-season" />
      </div>

      {/* LAYER 3: TIMELINE */}
      <div
        className="stack-layer stack-layer-timeline"
        ref={layerTimelineRef}
        id="layer-timeline"
      >
        {timeline}
      </div>
    </div>
  );
};
