export interface SceneTier {
  name: "mobile" | "tablet" | "desktop";
  mobile: boolean;
  coarsePointer: boolean;
  reducedMotion: boolean;
  maxDpr: number;
  frameInterval: number;
  pointerEnabled: boolean;
  antialias: boolean;
  trailSamples: number;
  outline: boolean;
  reveal: boolean;
  freeze: boolean;
}

export interface HeroSceneParams {
  cameraZ: number;
  subjectScale: number;
  subjectX: number;
  subjectY: number;
  subjectParallax: number;
  riseDistance: number;
  riseDuration: number;
  headScale: number;
  headY: number;
  headParallax: number;
  headRelight: number;
  helmetScale: number;
  helmetX: number;
  helmetY: number;
  helmetZ: number;
  helmetFollow: number;
  helmetAmpX: number;
  helmetCurveX: number;
  helmetAmpY: number;
  helmetCurveY: number;
  helmetBrightness: number;
  trailRadius: number;
  trailIdleScale: number;
  trailTaper: number;
  trailTaperIdle: number;
  trailTaperFast: number;
  trailLength: number;
  revealThreshold: number;
  revealEdge: number;
  revealWarp: number;
  revealWarpScale: number;
  revealSpeed: number;
  pointerLerp: number;
  pacePeak: number;
  paceAttack: number;
  paceRelease: number;
  paceThreshold: number;
  paceRamp: number;
  outlinePeriod: number;
  sweepWarp: number;
  sweepLength: number;
  sweepRadius: number;
  outlineStagger: number;
  outlineOpacity: number;
  outlineWidth: number;
  outlineBase: number;
  outlineLightness: number;
  bgLineScale: number;
  bgLineCount: number;
  bgLineThickness: number;
  bgLineOpacity: number;
  bgWaveAmount: number;
  bgWaveSpeed: number;
  bgRevealLightness: number;
  bgRevealLightnessAlt: number;
  bgRevealOpacity: number;
  introDuration: number;
  burnStart: number;
  burnSoftness: number;
  burnGlow: number;
  autoSweepAmount: number;
  autoSweepPeriod: number;
  autoSweepStroke: number;
  autoSweepHold: number;
}

export interface BoxRect {
  top: number;
  height: number;
}

export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
  atRest: boolean;
}

export interface RevealUnit {
  el: HTMLElement;
  state: SpringState;
  delay: number;
  started: boolean;
}

export interface HeroProps {
  onLoaded?: () => void;
  className?: string;
}
