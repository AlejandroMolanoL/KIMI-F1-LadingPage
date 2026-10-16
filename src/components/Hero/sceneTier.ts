import type { SceneTier } from "./types";

/**
 * The cap for touch tiers, as the shared ticker measures it.
 * Two milliseconds under puts 60Hz on every tick and 120Hz on every second one.
 */
export const CAP_60 = 1000 / 60 - 2;

/**
 * The nearest web-exposed proxy for iOS Low Power Mode.
 * Save-Data is an explicit request to spend less; 2GB or under is the class of
 * device that cannot hold a 60fps fragment loop anyway.
 */
export const isEnergySaver = (): boolean => {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2;
};

/**
 * Device tier for the hero scene — decided once at construction, read by
 * everything (DPR, frame budget, pointer, antialias, mask cost).
 */
export const getSceneTier = (): SceneTier => {
  if (typeof window === "undefined") {
    return {
      name: "desktop",
      mobile: false,
      coarsePointer: false,
      reducedMotion: false,
      maxDpr: 1.5,
      frameInterval: 0,
      pointerEnabled: true,
      antialias: true,
      trailSamples: 72,
      outline: true,
      reveal: true,
      freeze: false,
    };
  }

  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const width = window.innerWidth;
  const name: "mobile" | "tablet" | "desktop" =
    width < 768 || (coarse && width < 1024)
      ? "mobile"
      : coarse || width < 1280
      ? "tablet"
      : "desktop";

  const mobile = name === "mobile";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saver = isEnergySaver();

  return {
    name,
    mobile,
    coarsePointer: coarse,
    reducedMotion,
    // 1 -> 1.25 -> 1.5 max DPR. Cap DPR on mobile/tablet to drastically cut fragment fill rate!
    maxDpr: mobile ? 1 : name === "tablet" ? 1.25 : 1.5,
    frameInterval: name === "desktop" ? 0 : CAP_60,
    pointerEnabled: !coarse && !reducedMotion,
    antialias: name === "desktop",
    trailSamples: mobile ? 28 : name === "tablet" ? 44 : 72,
    outline: !mobile,
    reveal: !mobile,
    freeze: reducedMotion || (mobile && saver),
  };
};
