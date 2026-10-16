import React, { useEffect, useRef } from "react";
import { ChequeredSeam } from "../common/ChequeredSeam";
import {
  TRACK_RIBBON,
  LAP_CENTRELINE,
  LAP_LENGTH,
  CIRCUIT_PATH,
  CIRCUIT_MARKERS,
  CORNER_MARKS,
  CORNER_MARK_SIZE,
  TURNS,
  TURN_POINTS,
  FLAG_DIAMONDS,
  FLAG_CUT,
  mapToArtboard,
} from "./circuitData";
import { DOTS, DOT_LATTICE, DOT_RADIUS } from "./halftoneData";
import "./Season.css";

export const Season: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const halftoneCanvasRef = useRef<HTMLCanvasElement>(null);
  const traceCanvasRef = useRef<HTMLCanvasElement>(null);
  const lapMaskRef = useRef<SVGPathElement>(null);
  const globeMeridianRef = useRef<SVGEllipseElement>(null);
  const hubPingRef = useRef<SVGCircleElement>(null);

  // Text and UI elements
  const head1Ref = useRef<HTMLSpanElement>(null);
  const head2WordsRef = useRef<HTMLSpanElement>(null);
  const headDotRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Stage fit logic
    const fitStage = () => {
      if (!stageRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w >= 1024) {
        const s = Math.max(w / 1440, h / 800);
        const tx = (w - 1440 * s) / 2;
        const ty = (h - 800 * s) / 2;
        stageRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      } else {
        const trackBox = { width: 750, height: 550, cx: 720, cy: 400 };
        const s = w / trackBox.width;
        const tx = (w - 1440 * s) / 2;
        const ty = (h - 800 * s) / 2;
        stageRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      }
    };
    window.addEventListener("resize", fitStage);
    fitStage();

    // 2. Halftone Offscreen Pre-bake
    const htBaked = document.createElement("canvas");
    htBaked.width = 2560;
    htBaked.height = 1440;
    const bakeCtx = htBaked.getContext("2d");
    if (bakeCtx) {
      bakeCtx.fillStyle = "#7a7a7a";
      bakeCtx.beginPath();
      const { points, count } = DOTS;
      for (let i = 0; i < count; i++) {
        const x = points[i * 2];
        const y = points[i * 2 + 1];
        bakeCtx.moveTo(x + DOT_RADIUS, y);
        bakeCtx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      }
      bakeCtx.fill();
    }

    // 3. Halftone setup & spatial index
    const htCanvas = halftoneCanvasRef.current;
    const htCtx = htCanvas?.getContext("2d");
    const resizeHalftone = () => {
      if (!htCanvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      htCanvas.width = 2560 * ratio;
      htCanvas.height = 1440 * ratio;
    };
    resizeHalftone();
    window.addEventListener("resize", resizeHalftone);

    const latticeIndex = (() => {
      const { columns, rows, count } = DOTS;
      let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
      for (let i = 0; i < count; i++) {
        if (columns[i] < minI) minI = columns[i];
        if (columns[i] > maxI) maxI = columns[i];
        if (rows[i] < minJ) minJ = rows[i];
        if (rows[i] > maxJ) maxJ = rows[i];
      }
      const w = maxI - minI + 1;
      const h = maxJ - minJ + 1;
      const cell = new Int32Array(w * h).fill(-1);
      for (let i = 0; i < count; i++) {
        cell[(rows[i] - minJ) * w + (columns[i] - minI)] = i;
      }
      return { cell, w, h, minI, minJ };
    })();

    const htLevel = new Float32Array(DOTS.count);
    const htActive = new Int32Array(DOTS.count);
    const htInList = new Uint8Array(DOTS.count);
    let htActiveCount = 0;

    const pointerTarget = { x: 1280, y: 720, on: false };
    const pointerLight = { x: 1280, y: 720, heat: 0 };
    let htSpread = 0;
    let htLastTime = performance.now();
    let reticleArmed = false;

    const approach = (from: number, to: number, dt: number, tau: number) =>
      to + (from - to) * Math.exp(-dt / Math.max(tau, 1e-4));

    const onPointerMove = (e: PointerEvent) => {
      if (!reticleArmed || !htCanvas) return;
      const rect = htCanvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2560;
      const y = ((e.clientY - rect.top) / rect.height) * 1440;
      pointerTarget.x = x;
      pointerTarget.y = y;
      pointerTarget.on = true;
    };
    const onPointerLeave = () => {
      pointerTarget.on = false;
    };

    const secEl = sectionRef.current;
    if (secEl) {
      secEl.addEventListener("pointermove", onPointerMove);
      secEl.addEventListener("pointerleave", onPointerLeave);
    }

    // 4. Lap Trace cumulative & corner-brake timings
    const CUMULATIVE = CIRCUIT_PATH.reduce<number[]>((acc, point, index) => {
      if (index === 0) return [0];
      const previous = CIRCUIT_PATH[index - 1];
      acc.push(acc[index - 1] + Math.hypot(point[0] - previous[0], point[1] - previous[1]));
      return acc;
    }, []);
    const TOTAL = CUMULATIVE[CUMULATIVE.length - 1];

    const CORNER_BRAKE = 9;
    const TIME_AT = (() => {
      const count = CIRCUIT_PATH.length;
      const turn = new Array(count).fill(0);
      for (let i = 1; i < count - 1; i += 1) {
        const [ax, ay] = CIRCUIT_PATH[i - 1];
        const [bx, by] = CIRCUIT_PATH[i];
        const [cx, cy] = CIRCUIT_PATH[i + 1];
        const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by;
        const lengths = (Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1);
        turn[i] = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / lengths)));
      }
      const windowSize = 6;
      const smoothed = turn.map((_, i) => {
        let sum = 0, n = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(count - 1, i + windowSize); j += 1) {
          sum += turn[j];
          n += 1;
        }
        return sum / n;
      });
      const accumulated = [0];
      for (let i = 1; i < count; i += 1) {
        const span = CUMULATIVE[i] - CUMULATIVE[i - 1];
        const speed = 1 / (1 + CORNER_BRAKE * smoothed[i]);
        accumulated.push(accumulated[i - 1] + span / speed);
      }
      const total = accumulated[count - 1] || 1;
      return accumulated.map((val) => val / total);
    })();

    const distanceAtTime = (time: number) => {
      if (time <= 0) return 0;
      if (time >= 1) return TOTAL;
      let low = 0, high = TIME_AT.length - 1;
      while (low < high - 1) {
        const mid = (low + high) >> 1;
        if (TIME_AT[mid] <= time) low = mid;
        else high = mid;
      }
      const span = TIME_AT[high] - TIME_AT[low] || 1;
      const ratio = (time - TIME_AT[low]) / span;
      return CUMULATIVE[low] + (CUMULATIVE[high] - CUMULATIVE[low]) * ratio;
    };

    const traceCanvas = traceCanvasRef.current;
    const traceCtx = traceCanvas?.getContext("2d");
    const lapMask = lapMaskRef.current;
    if (lapMask) {
      lapMask.setAttribute("stroke-dasharray", `${LAP_LENGTH + 60}`);
      lapMask.setAttribute("stroke-dashoffset", `${LAP_LENGTH + 60}`);
    }

    const CUT_CENTRE = mapToArtboard(FLAG_CUT.x, FLAG_CUT.y);
    const CUT_SCALE = 1438.43 / 2560;
    const CUT_ALONG = FLAG_CUT.along * CUT_SCALE;
    const CUT_ACROSS = FLAG_CUT.across * CUT_SCALE;

    let lapActive = false;
    let lapStartTime: number | null = null;
    let lapProgressVal = 0;
    let lapHeatVal = 1;
    let lapCoolStartTime: number | null = null;

    // IntersectionObserver to start lap
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !lapActive && lapStartTime === null) {
          lapActive = true;
          lapStartTime = performance.now();
        }
      });
    }, { threshold: 0.35 });
    if (secEl) obs.observe(secEl);

    // Spring reveals for UI
    let seasonStartTime: number | null = null;
    const uiObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && seasonStartTime === null) {
          seasonStartTime = performance.now();
        }
      });
    }, { threshold: 0.1 });
    if (secEl) uiObs.observe(secEl);

    // Main animation loop
    let rafId: number;
    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);

      // A. Dashed grid crawling offset & Hub Pulse
      const gridOffset = ((now / 7000) * 20.5) % 20.5;
      const dashes = secEl?.querySelectorAll(".grid-dash");
      dashes?.forEach((line) => line.setAttribute("stroke-dashoffset", gridOffset.toFixed(2)));

      if (hubPingRef.current) {
        const v = (now % 4200) / 4200;
        const r = 10.63 + v * 86;
        const opacity = 0.4 * (1 - v) * (1 - v);
        hubPingRef.current.setAttribute("r", r.toFixed(2));
        hubPingRef.current.setAttribute("opacity", opacity.toFixed(4));
      }

      // B. Globe Meridian Rotation
      if (globeMeridianRef.current && seasonStartTime !== null) {
        const elapsed = now - seasonStartTime;
        const turn = (elapsed / 10000) * (2 * Math.PI);
        const rx = Math.max(0.5, Math.abs(Math.cos(turn)) * 18);
        globeMeridianRef.current.setAttribute("rx", rx.toFixed(2));
      }

      // C. Lap Trace Render
      if (lapActive && lapStartTime !== null && traceCtx) {
        const age = now - lapStartTime;
        const lapDuration = 6000;
        lapProgressVal = Math.min(1, age / lapDuration);

        if (lapProgressVal >= 1) {
          if (lapCoolStartTime === null) {
            lapCoolStartTime = now;
            reticleArmed = true;
          }
          const coolAge = now - lapCoolStartTime;
          lapHeatVal = Math.max(0, 1 - coolAge / 1400);
          if (lapHeatVal <= 0) {
            lapActive = false;
          }
        }

        const distance = distanceAtTime(lapProgressVal);
        const reveal = 1 - distance / TOTAL;
        if (lapMask) {
          lapMask.setAttribute("stroke-dashoffset", `${60 + reveal * LAP_LENGTH}`);
        }

        traceCtx.clearRect(0, 0, 1440, 800);
        const points: [number, number][] = [];
        for (let i = 0; i < CIRCUIT_PATH.length; i += 1) {
          if (CUMULATIVE[i] <= distance) {
            points.push(CIRCUIT_PATH[i]);
          } else {
            const a = CIRCUIT_PATH[i - 1], b = CIRCUIT_PATH[i];
            const ratio = (distance - CUMULATIVE[i - 1]) / (CUMULATIVE[i] - CUMULATIVE[i - 1]);
            points.push([a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio]);
            break;
          }
        }

        if (points.length > 1) {
          traceCtx.save();
          traceCtx.globalCompositeOperation = "lighter";
          traceCtx.strokeStyle = "rgb(2 210 227 / 0.05)";
          traceCtx.lineWidth = 15;
          traceCtx.beginPath();
          traceCtx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) traceCtx.lineTo(points[i][0], points[i][1]);
          traceCtx.stroke();

          traceCtx.strokeStyle = "rgb(2 210 227 / 0.1)";
          traceCtx.lineWidth = 15 * 0.45;
          traceCtx.stroke();
          traceCtx.restore();

          const headCount = Math.max(2, Math.round(210 / 3));
          const fromIdx = Math.max(0, points.length - headCount);
          const tip = points[points.length - 1];
          const hot = traceCtx.createLinearGradient(points[fromIdx][0], points[fromIdx][1], tip[0], tip[1]);
          hot.addColorStop(0, "rgb(2 210 227 / 0)");
          hot.addColorStop(0.45, "rgb(2 210 227 / 0.9)");
          hot.addColorStop(
            1,
            `rgb(${Math.round(2 + (141 - 2) * lapHeatVal)} ${Math.round(210 + (243 - 210) * lapHeatVal)} ${Math.round(227 + (250 - 227) * lapHeatVal)} / 1)`
          );
          traceCtx.strokeStyle = hot;
          traceCtx.lineWidth = 5.9;
          traceCtx.lineCap = "round";
          traceCtx.lineJoin = "round";
          traceCtx.beginPath();
          traceCtx.moveTo(points[fromIdx][0], points[fromIdx][1]);
          for (let i = fromIdx + 1; i < points.length; i++) traceCtx.lineTo(points[i][0], points[i][1]);
          traceCtx.stroke();

          const coreFrom = Math.max(0, points.length - Math.round(headCount * 0.42));
          if (points.length - coreFrom > 1) {
            const core = traceCtx.createLinearGradient(points[coreFrom][0], points[coreFrom][1], tip[0], tip[1]);
            core.addColorStop(0, "rgb(141 243 250 / 0)");
            core.addColorStop(1, `rgb(255 255 255 / ${(0.95 * lapHeatVal).toFixed(4)})`);
            traceCtx.strokeStyle = core;
            traceCtx.lineWidth = 5.9 * 0.38;
            traceCtx.beginPath();
            traceCtx.moveTo(points[coreFrom][0], points[coreFrom][1]);
            for (let i = coreFrom + 1; i < points.length; i++) traceCtx.lineTo(points[i][0], points[i][1]);
            traceCtx.stroke();
          }

          traceCtx.save();
          traceCtx.globalCompositeOperation = "lighter";
          const spark = traceCtx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 5.9 * 2.6);
          spark.addColorStop(0, `rgb(255 255 255 / ${(0.85 * lapHeatVal).toFixed(4)})`);
          spark.addColorStop(0.35, `rgb(141 243 250 / ${(0.4 * lapHeatVal).toFixed(4)})`);
          spark.addColorStop(1, "rgb(2 210 227 / 0)");
          traceCtx.fillStyle = spark;
          traceCtx.beginPath();
          traceCtx.arc(tip[0], tip[1], 5.9 * 2.6, 0, Math.PI * 2);
          traceCtx.fill();
          traceCtx.restore();
        }

        // Punch out flag cut
        traceCtx.save();
        traceCtx.translate(CUT_CENTRE[0], CUT_CENTRE[1]);
        traceCtx.rotate((FLAG_CUT.angle * Math.PI) / 180);
        traceCtx.clearRect(-CUT_ALONG / 2, -CUT_ACROSS / 2, CUT_ALONG, CUT_ACROSS);
        traceCtx.restore();

        // Marker flares
        for (let m = 0; m < CIRCUIT_MARKERS.length; m++) {
          const marker = CIRCUIT_MARKERS[m];
          if (distance < marker.d) continue;
          const markerAge = Math.min(1, (distance - marker.d) / 90);
          const radius = 12 + (1 - markerAge) * 14;
          const glow = traceCtx.createRadialGradient(marker.x, marker.y, 0, marker.x, marker.y, radius);
          glow.addColorStop(0, `rgb(141 243 250 / ${(0.5 + 0.45 * (1 - markerAge)).toFixed(4)})`);
          glow.addColorStop(0.45, "rgb(2 210 227 / 0.32)");
          glow.addColorStop(1, "rgb(2 210 227 / 0)");
          traceCtx.save();
          traceCtx.globalCompositeOperation = "lighter";
          traceCtx.fillStyle = glow;
          traceCtx.beginPath();
          traceCtx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
          traceCtx.fill();
          traceCtx.restore();

          if (markerAge < 1) {
            traceCtx.strokeStyle = `rgb(141 243 250 / ${((1 - markerAge) * 0.6).toFixed(4)})`;
            traceCtx.lineWidth = 1;
            traceCtx.beginPath();
            traceCtx.arc(marker.x, marker.y, 9 + markerAge * 20, 0, Math.PI * 2);
            traceCtx.stroke();
          }
        }
      }

      // D. Halftone Pointer Reticle & Decay
      if (htCtx && htCanvas) {
        const dt = Math.min(0.1, (now - htLastTime) / 1000);
        htLastTime = now;

        const px = pointerLight.x;
        const py = pointerLight.y;
        const wanted = pointerTarget.on ? 0.95 : 0;

        if (pointerLight.heat <= 0.001 && wanted > 0) {
          pointerLight.x = pointerTarget.x;
          pointerLight.y = pointerTarget.y;
        } else if (dt > 0) {
          pointerLight.x = approach(px, pointerTarget.x, dt, 0.07);
          pointerLight.y = approach(py, pointerTarget.y, dt, 0.07);
          const speed = Math.hypot(pointerLight.x - px, pointerLight.y - py) / dt;
          const wantedSpread = Math.max(0, 1 - speed / 900);
          htSpread = approach(htSpread, wantedSpread, dt, wantedSpread > htSpread ? 0.38 : 0.09);
        }
        pointerLight.heat = approach(pointerLight.heat, wanted, dt, wanted > pointerLight.heat ? 0.14 : 0.3);
        if (pointerLight.heat < 0.005) {
          pointerLight.heat = 0;
          htSpread = 0;
        }

        const decay = Math.exp(-dt / (0.9 / 3));
        let write = 0;
        for (let k = 0; k < htActiveCount; k++) {
          const idx = htActive[k];
          const val = htLevel[idx] * decay;
          if (val > 0.02) {
            htLevel[idx] = val;
            htActive[write++] = idx;
          } else {
            htLevel[idx] = 0;
            htInList[idx] = 0;
          }
        }
        htActiveCount = write;

        if (pointerLight.heat > 0.01) {
          const add = (idx: number, value: number) => {
            if (value <= 0.02) return;
            if (value > htLevel[idx]) htLevel[idx] = value;
            if (!htInList[idx]) {
              htInList[idx] = 1;
              htActive[htActiveCount++] = idx;
            }
          };

          const { cell, w, h, minI, minJ } = latticeIndex;
          const { points } = DOTS;
          const ci = Math.round((pointerLight.x - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
          const cj = Math.round((pointerLight.y - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
          const arm = 0.82 * pointerLight.heat;
          const reach = 420 * htSpread;

          if (reach > 1 && cj >= minJ && cj < minJ + h) {
            const row = (cj - minJ) * w;
            const span = Math.ceil(reach / DOT_LATTICE.pitchX);
            const from = Math.max(minI, ci - span);
            const to = Math.min(minI + w - 1, ci + span);
            for (let i = from; i <= to; i++) {
              const idx = cell[row + (i - minI)];
              if (idx >= 0) {
                const d = Math.abs(points[idx * 2] - pointerLight.x);
                add(idx, (1 - d / reach) * arm);
              }
            }
          }

          if (reach > 1 && ci >= minI && ci < minI + w) {
            const span = Math.ceil(reach / DOT_LATTICE.pitchY);
            const from = Math.max(minJ, cj - span);
            const to = Math.min(minJ + h - 1, cj + span);
            for (let j = from; j <= to; j++) {
              const idx = cell[(j - minJ) * w + (ci - minI)];
              if (idx >= 0) {
                const d = Math.abs(points[idx * 2 + 1] - pointerLight.y);
                add(idx, (1 - d / reach) * arm);
              }
            }
          }

          const i0 = Math.floor((pointerLight.x - 54 - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
          const i1 = Math.ceil((pointerLight.x + 54 - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
          const j0 = Math.floor((pointerLight.y - 54 - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
          const j1 = Math.ceil((pointerLight.y + 54 - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
          for (let j = Math.max(minJ, j0); j <= Math.min(minJ + h - 1, j1); j++) {
            const row = (j - minJ) * w;
            for (let i = Math.max(minI, i0); i <= Math.min(minI + w - 1, i1); i++) {
              const idx = cell[row + (i - minI)];
              if (idx >= 0) {
                const d = Math.hypot(points[idx * 2] - pointerLight.x, points[idx * 2 + 1] - pointerLight.y);
                if (d < 54) {
                  const u = 1 - d / 54;
                  add(idx, u * u * pointerLight.heat);
                }
              }
            }
          }
        }

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        htCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
        htCtx.clearRect(0, 0, 2560, 1440);
        htCtx.drawImage(htBaked, 0, 0, 2560, 1440);

        if (htActiveCount > 0) {
          const { points, columns, rows } = DOTS;
          const box = DOT_RADIUS * 2 + 1;
          for (let k = 0; k < htActiveCount; k++) {
            const idx = htActive[k];
            if (htLevel[idx] < 0.34) continue;
            htCtx.clearRect(points[idx * 2] - DOT_RADIUS - 0.5, points[idx * 2 + 1] - DOT_RADIUS - 0.5, box, box);
          }
          for (let k = 0; k < htActiveCount; k++) {
            const idx = htActive[k];
            const val = htLevel[idx];
            if (val < 0.34) continue;
            if ((columns[idx] + rows[idx]) & 1) continue;
            const t = Math.min(1, (val - 0.34) / 0.66);
            const side = DOT_LATTICE.pitchX * (0.7 + 0.3 * t);
            htCtx.fillStyle = val > 0.8 ? "#ffffff" : val > 0.5 ? "rgb(141 243 250)" : "rgb(2 210 227)";
            htCtx.fillRect(points[idx * 2] - side / 2, points[idx * 2 + 1] - side / 2, side, side);
          }
        }
      }

      // E. UI Entrance Reveals
      if (seasonStartTime !== null) {
        const elapsed = now - seasonStartTime;
        if (head1Ref.current) head1Ref.current.style.opacity = "1";
        if (head2WordsRef.current) head2WordsRef.current.style.opacity = "1";
        if (headDotRef.current && elapsed >= 240) headDotRef.current.style.opacity = "1";
        if (ruleRef.current && elapsed >= 260) {
          ruleRef.current.style.opacity = "1";
          ruleRef.current.style.transform = "scaleX(1)";
        }
        if (introRef.current && elapsed >= 350) introRef.current.style.opacity = "1";
        if (plateRef.current && elapsed >= 260) {
          plateRef.current.style.opacity = "1";
          plateRef.current.style.transform = "translateY(0)";
        }
      }
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", fitStage);
      window.removeEventListener("resize", resizeHalftone);
      obs.disconnect();
      uiObs.disconnect();
      if (secEl) {
        secEl.removeEventListener("pointermove", onPointerMove);
        secEl.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, []);

  return (
    <section data-season id="season-section" ref={sectionRef}>
      {/* Chequered dissolve seam at top carrying light */}
      <ChequeredSeam carry="light" />

      {/* Circuit Stage */}
      <div className="circuit-frame">
        <div className="circuit-stage" ref={stageRef}>
          <div className="map-box">
            {/* Halftone Canvas */}
            <canvas className="halftone-canvas" ref={halftoneCanvasRef} />

            {/* Circuit Map SVG */}
            <svg
              className="map-svg"
              viewBox="0 0 2560 1440"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <mask id="lap-reveal-mask">
                  <path
                    ref={lapMaskRef}
                    d={LAP_CENTRELINE}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={30}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </mask>
                <mask id="track-cut-mask">
                  <rect width="2560" height="1440" fill="#ffffff" />
                  <g
                    transform={`translate(${FLAG_CUT.x}, ${FLAG_CUT.y}) rotate(${FLAG_CUT.angle})`}
                  >
                    <rect
                      x={-FLAG_CUT.along / 2}
                      y={-FLAG_CUT.across / 2}
                      width={FLAG_CUT.along}
                      height={FLAG_CUT.across}
                      fill="#000000"
                    />
                  </g>
                </mask>
              </defs>

              {/* Grid lines and axes */}
              <g id="map-grid-group">
                <line
                  className="grid-dash"
                  x1="0"
                  y1="699.5"
                  x2="2560"
                  y2="699.5"
                  stroke="var(--map-grid)"
                  strokeWidth="1.06"
                  strokeDasharray="6.4 14.1"
                />
                <line
                  className="grid-dash"
                  x1="1278.48"
                  y1="0"
                  x2="1278.48"
                  y2="1440"
                  stroke="var(--map-grid)"
                  strokeWidth="1.06"
                  strokeDasharray="6.4 14.1"
                />
                <circle
                  cx="1278.48"
                  cy="699.5"
                  r="69.85"
                  fill="none"
                  stroke="var(--map-grid)"
                  strokeWidth="3.04"
                />
                <circle
                  cx="1278.48"
                  cy="699.5"
                  r="356.06"
                  fill="none"
                  stroke="var(--map-grid-ghost)"
                  strokeWidth="2.13"
                />
                <circle
                  cx="1278.48"
                  cy="699.5"
                  r="442.61"
                  fill="none"
                  stroke="var(--map-grid-ghost)"
                  strokeWidth="2.13"
                />

                {/* Hub Pulse Ping */}
                <circle
                  ref={hubPingRef}
                  cx="1278.48"
                  cy="699.5"
                  r="10.63"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.13"
                />
                {/* Hub Center Dot */}
                <circle cx="1278.48" cy="699.5" r="10.63" fill="var(--map-mark)" />
              </g>

              {/* Corner Marks */}
              <g id="map-corner-marks">
                {CORNER_MARKS.map(([cx, cy], idx) => (
                  <rect
                    key={idx}
                    x={cx - CORNER_MARK_SIZE / 2}
                    y={cy - CORNER_MARK_SIZE / 2}
                    width={CORNER_MARK_SIZE}
                    height={CORNER_MARK_SIZE}
                    fill="var(--map-mark)"
                  />
                ))}
              </g>

              {/* Track Ribbon (White Base & Cyan Masked Fill) */}
              <g mask="url(#track-cut-mask)">
                <path d={TRACK_RIBBON} fill="var(--foreground-on-dark)" />
                <path
                  d={TRACK_RIBBON}
                  fill="var(--accent)"
                  mask="url(#lap-reveal-mask)"
                />
              </g>

              {/* Markers & Flag Diamonds */}
              <g id="map-markers-group">
                {TURNS.map((t, idx) => (
                  <polygon
                    key={idx}
                    points={TURN_POINTS}
                    fill="var(--accent)"
                    transform={`translate(${t.x}, ${t.y}) rotate(${t.angle})`}
                  />
                ))}
                <path d={FLAG_DIAMONDS} fill="var(--map-mark)" />
              </g>
            </svg>
          </div>

          {/* Lap Trace Canvas */}
          <canvas
            className="trace-canvas"
            ref={traceCanvasRef}
            width="1440"
            height="800"
          />
        </div>
      </div>

      {/* Season Copy Content */}
      <div className="season-copy-wrap">
        <div className="season-head-wrap">
          <h2 className="season-h2">
            <span className="season-h2-line" ref={head1Ref}>
              THE SEASON
            </span>
            <span className="season-h2-line">
              <span className="season-words-span" ref={head2WordsRef}>
                SO FAR
              </span>
              <span
                className="season-dot-span"
                ref={headDotRef}
                style={{ color: "var(--foreground-on-dark)", opacity: 0 }}
              >
                .
              </span>
            </span>
          </h2>
          <div
            className="season-rule"
            ref={ruleRef}
            style={{ opacity: 0, transform: "scaleX(0)" }}
          />
          <p
            className="season-intro"
            ref={introRef}
            style={{ opacity: 0, transition: "opacity 400ms ease" }}
          >
            Every race is a step forward. Here's how the season is shaping up.
          </p>
        </div>

        {/* Standings Plate */}
        <div
          className="standings-plate"
          ref={plateRef}
          style={{ opacity: 0, transform: "translateY(1rem)", transition: "opacity 500ms ease, transform 500ms ease" }}
        >
          <svg className="standings-plate-svg" viewBox="0 0 277 78">
            <path
              d="M0.5 0.5H276.5V69L268 77.5H0.5Z"
              fill="var(--surface-black)"
              stroke="var(--accent)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="83"
              y1="0.5"
              x2="83"
              y2="77.5"
              stroke="var(--accent)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Badge Cell */}
          <div className="plate-badge-cell">
            <svg
              className="globe-svg"
              viewBox="0 0 37 23"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1"
            >
              <ellipse cx="18.5" cy="11.5" rx="18" ry="11" />
              <line x1="0.5" y1="11.5" x2="36.5" y2="11.5" />
              <ellipse ref={globeMeridianRef} cx="18.5" cy="11.5" rx="18" ry="11" />
            </svg>
            <div className="plate-eyebrows">
              <span style={{ color: "var(--foreground-on-dark)" }}>F1</span>
              <span style={{ color: "var(--accent)" }}>/ 2026</span>
            </div>
          </div>
          {/* Stats Cell */}
          <dl className="plate-stats-cell">
            <div className="plate-stat-row">
              <dt>P1</dt>
              <dd>in the championship</dd>
            </div>
            <div className="plate-stat-row">
              <dt>6</dt>
              <dd>wins</dd>
            </div>
            <div className="plate-stat-row">
              <dt>9</dt>
              <dd>podiums.</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};
