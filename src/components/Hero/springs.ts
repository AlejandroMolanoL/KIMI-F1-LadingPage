import type { SpringConfig, SpringState, RevealUnit } from "./types";

export const SPRING_CONFIGS = {
  REVEAL: { tension: 90, friction: 26 },
  ROW: { tension: 170, friction: 24 },
  ITEM: { tension: 170, friction: 24 },
  SHEET: { tension: 190, friction: 26 },
  FIGURE: { tension: 200, friction: 24 },
  TYPE: { tension: 210, friction: 24 },
  YEAR: { tension: 190, friction: 24 },
  COPY: { tension: 110, friction: 26 },
  COPY2: { tension: 150, friction: 24 },
  NAME: { tension: 190, friction: 24 },
  VEIL: { tension: 70, friction: 24 },
  CLEAR: { tension: 140, friction: 26 },
  LABEL: { tension: 110, friction: 26 },
  PROGRESS_WAITING: { tension: 10, friction: 30 },
  PROGRESS_READY: { tension: 170, friction: 26 },
  YEAR_SETTLE: { tension: 32, friction: 26 },
  TRIGGER: { tension: 140, friction: 30 },
} as const;

export function stepSpringValue(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dtMs: number
): void {
  if (state.atRest && state.value === target) return;

  const capDt = Math.min(dtMs, 64);
  const substeps = Math.max(1, Math.ceil(capDt));
  const subDt = capDt / substeps / 1000;
  const tension = config.tension;
  const friction = config.friction;
  const mass = config.mass ?? 1;

  for (let i = 0; i < substeps; i++) {
    const displacement = state.value - target;
    const springForce = -tension * displacement;
    const dampingForce = -friction * state.velocity;
    const acceleration = (springForce + dampingForce) / mass;
    state.velocity += acceleration * subDt;
    state.value += state.velocity * subDt;
  }

  if (Math.abs(state.velocity) < 0.01 && Math.abs(state.value - target) < 0.005) {
    state.value = target;
    state.velocity = 0;
    state.atRest = true;
  } else {
    state.atRest = false;
  }
}

export function setupWordReveal(
  container: HTMLElement,
  text: string,
  delayIn = 0,
  stagger = 110
): RevealUnit[] {
  const words = text.split(" ");
  container.innerHTML = "";
  const units: RevealUnit[] = [];

  words.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "reveal-unit";
    span.setAttribute("aria-hidden", "true");
    span.style.opacity = "0";
    span.style.transform = "translateY(0.35em)";
    span.textContent = w;
    container.appendChild(span);

    if (i < words.length - 1) {
      container.appendChild(document.createTextNode(" "));
    }

    units.push({
      el: span,
      state: { value: 0, velocity: 0, atRest: true },
      delay: delayIn + i * stagger,
      started: false,
    });
  });

  return units;
}

export function setupLetterReveal(
  container: HTMLElement,
  text: string,
  delayIn = 0,
  stagger = 26
): RevealUnit[] {
  container.innerHTML = "";
  const units: RevealUnit[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const span = document.createElement("span");
    span.className = "reveal-unit";
    span.setAttribute("aria-hidden", "true");
    span.style.opacity = "0";
    span.style.transform = "translateY(0.3em)";
    span.textContent = ch === " " ? "\u00A0" : ch;
    container.appendChild(span);

    units.push({
      el: span,
      state: { value: 0, velocity: 0, atRest: true },
      delay: delayIn + i * stagger,
      started: false,
    });
  }

  return units;
}

export function updateRevealUnits(
  units: RevealUnit[],
  elapsedMs: number,
  dtMs: number,
  config: SpringConfig = SPRING_CONFIGS.REVEAL,
  translateYEm = 0.35
): void {
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (elapsedMs >= u.delay) {
      stepSpringValue(u.state, 1, config, dtMs);
      const p = u.state.value;
      u.el.style.opacity = p.toFixed(4);
      u.el.style.transform = `translateY(${((1 - p) * translateYEm).toFixed(4)}em)`;
    }
  }
}
