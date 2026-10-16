import React, { useEffect, useRef } from "react";
import "./ChequeredSeam.css";

interface ChequeredSeamProps {
  carry?: "light" | "dark";
  progress?: number;
  className?: string;
  id?: string;
}

export const ChequeredSeam: React.FC<ChequeredSeamProps> = ({
  carry = "light",
  progress: externalProgress,
  className = "",
  id,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let rafId: number;

    const noise = (x: number, y: number, seed = 0) => {
      let h = Math.imul(x, 374761393) + Math.imul(y + seed, 668265263);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };

    const getProgress = (): number => {
      if (externalProgress !== undefined) {
        return externalProgress;
      }
      const rect = canvas.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const height = rect.height || 168;

      // When canvas is entering from the bottom or pinning at top
      if (rect.top <= 0) {
        // As user scrolls past the seam into the section, it dissolves away
        return Math.min(1, Math.max(0, -rect.top / (height * 1.5)));
      } else if (rect.top < vh) {
        // Entering from bottom towards top: subtle wave/lift
        const entryRatio = (vh - rect.top) / vh;
        return Math.min(0.25, entryRatio * 0.25);
      }
      return 0;
    };

    const render = () => {
      const width = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || 168;
      if (!width || !height) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const CELL = 24;
      const LIFT = 2;
      const ACCENT_SHARE = 0.08;
      const accent = "#02d2e3";
      const surface = carry === "light" ? "#f7fafb" : "#090a0b";

      const columns = Math.ceil(width / CELL);
      const rows = Math.ceil(height / CELL);
      const currentProgress = getProgress();
      const lift = currentProgress * LIFT;

      for (let y = 0; y < rows; y += 1) {
        const depth = y / Math.max(1, rows - 1) + lift;
        if (depth > 1) break;
        const fade = Math.min(1, Math.max(0, 1 - depth));
        if (fade <= 0) break;

        for (let x = 0; x < columns; x += 1) {
          if ((x + y) % 2 !== 0) continue;
          if (noise(x, y) > fade) continue;

          context.fillStyle =
            noise(x + 101, y + 57) < ACCENT_SHARE ? accent : surface;
          context.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    });
    resizeObserver.observe(canvas);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    render();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [carry, externalProgress]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={`chequered-seam ${className}`}
      data-carry={carry}
      aria-hidden="true"
    />
  );
};

export default ChequeredSeam;
