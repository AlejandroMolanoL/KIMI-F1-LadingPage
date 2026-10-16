import React, { useEffect, useRef } from "react";

interface ContourCanvasProps {
  strokeColor: string;
  className?: string;
  id?: string;
}

export const ContourCanvas: React.FC<ContourCanvasProps> = ({
  strokeColor,
  className = "",
  id,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const startTime = performance.now();
    let animId: number | null = null;
    let isVisible = true;

    const LINE_SCALE = 3.8;
    const LINE_COUNT = 2.5;
    const WAVE_AMOUNT = 0.37;
    const WAVE_SPEED = 1.66;
    const LINE_OPACITY = 0.85;
    const CELLS = 96;

    const field = (x: number, y: number, t: number) => {
      let f = Math.sin(x * 1.0 + t * 0.6) * 0.5;
      f += Math.sin(y * 0.85 - t * 0.45) * 0.45;
      f += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35;
      f += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25;
      return f * 0.5 + 0.5;
    };

    const render = (now: number) => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const t = ((now - startTime) / 1000) * WAVE_SPEED;
      const cols =
        width >= height ? CELLS : Math.max(8, Math.round((CELLS * width) / height));
      const rows = Math.max(8, Math.round((cols * height) / width));
      const stepX = width / cols;
      const stepY = height / rows;
      const aspect = width / height;
      const values = new Float32Array((cols + 1) * (rows + 1));

      for (let j = 0; j <= rows; j += 1) {
        for (let i = 0; i <= cols; i += 1) {
          const nx = ((i / cols) * 2 - 1) * aspect * LINE_SCALE;
          const ny = ((j / rows) * 2 - 1) * LINE_SCALE;
          const qx = nx + Math.sin(ny * 0.8 + t * 0.7) * WAVE_AMOUNT;
          const qy = ny + Math.cos(nx * 0.7 - t * 0.6) * WAVE_AMOUNT;
          values[j * (cols + 1) + i] = field(qx, qy, t) * LINE_COUNT;
        }
      }

      context.strokeStyle = strokeColor;
      context.lineWidth = 1;
      context.globalAlpha = LINE_OPACITY;
      context.beginPath();

      for (let level = 0.5; level < LINE_COUNT; level += 1) {
        for (let j = 0; j < rows; j += 1) {
          for (let i = 0; i < cols; i += 1) {
            const a = values[j * (cols + 1) + i];
            const b = values[j * (cols + 1) + i + 1];
            const c = values[(j + 1) * (cols + 1) + i + 1];
            const d = values[(j + 1) * (cols + 1) + i];
            const index =
              (a > level ? 8 : 0) |
              (b > level ? 4 : 0) |
              (c > level ? 2 : 0) |
              (d > level ? 1 : 0);
            if (index === 0 || index === 15) continue;
            const x0 = i * stepX;
            const y0 = j * stepY;
            const top = [x0 + stepX * ((level - a) / (b - a)), y0];
            const right = [x0 + stepX, y0 + stepY * ((level - b) / (c - b))];
            const bottom = [x0 + stepX * ((level - d) / (c - d)), y0 + stepY];
            const left = [x0, y0 + stepY * ((level - a) / (d - a))];
            const segment = (p: number[], q: number[]) => {
              context.moveTo(p[0], p[1]);
              context.lineTo(q[0], q[1]);
            };
            switch (index) {
              case 1:
              case 14:
                segment(left, bottom);
                break;
              case 2:
              case 13:
                segment(bottom, right);
                break;
              case 3:
              case 12:
                segment(left, right);
                break;
              case 4:
              case 11:
                segment(top, right);
                break;
              case 6:
              case 9:
                segment(top, bottom);
                break;
              case 7:
              case 8:
                segment(left, top);
                break;
              case 5:
                segment(left, top);
                segment(bottom, right);
                break;
              case 10:
                segment(left, bottom);
                segment(top, right);
                break;
            }
          }
        }
      }
      context.stroke();
      context.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          isVisible = e.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [strokeColor]);

  return <canvas ref={canvasRef} id={id} className={className} aria-hidden="true" />;
};

export default ContourCanvas;
