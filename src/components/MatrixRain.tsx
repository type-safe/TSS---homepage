import React, { useEffect, useRef } from "react";

/** Latin letters only (upper + lower) */
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Per-frame vertical step (row units); lower = slower fall */
const DROP_SPEED_MIN = 0.09;
const DROP_SPEED_MAX = 0.14;

/** Cursor slowdown: columns within ~this many character widths ease toward MIN_COLUMN_SPEED_MULT */
const CURSOR_SLOW_SIGMA_COLS = 3.45;
const MIN_COLUMN_SPEED_MULT = 0.14;

/** 0 = full speed everywhere; 1 = cursor column uses MIN_COLUMN_SPEED_MULT */
function columnSpeedMultiplier(
  columnIndex: number,
  mouseX: number | null,
  fontSize: number
): number {
  if (mouseX == null) return 1;
  const cursorCol = mouseX / fontSize;
  const dist = Math.abs(columnIndex + 0.5 - cursorCol);
  const influence = Math.exp(
    -(dist * dist) / (2 * CURSOR_SLOW_SIGMA_COLS * CURSOR_SLOW_SIGMA_COLS)
  );
  return MIN_COLUMN_SPEED_MULT + (1 - MIN_COLUMN_SPEED_MULT) * (1 - influence);
}

type MatrixRainProps = {
  className?: string;
  fontSize?: number;
  /** 0–1 fade strength per frame; higher = shorter trails */
  fadeAlpha?: number;
};

export function MatrixRain({
  className,
  fontSize = 14,
  fadeAlpha = 0.055,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dropsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const columns = Math.max(1, Math.floor(w / fontSize));
      dropsRef.current = Array.from({ length: columns }, () =>
        Math.random() * -50
      );

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      /* resize() already cleared to black; static background only */
      return () => window.removeEventListener("resize", resize);
    }

    const mouseXRef = { current: null as number | null };

    const onPointerMove = (e: PointerEvent) => {
      mouseXRef.current = e.clientX;
    };

    const onPointerLeave = () => {
      mouseXRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px ui-monospace, "Cascadia Code", "SF Mono", Menlo, Monaco, Consolas, monospace`;
      ctx.textBaseline = "top";

      const drops = dropsRef.current;
      const mx = mouseXRef.current;
      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];

        const head = Math.random() > 0.96;
        ctx.fillStyle = head ? "#ffffff" : "rgba(255, 255, 255, 0.45)";
        ctx.fillText(ch, x, y);

        if (y > h && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          const base =
            DROP_SPEED_MIN + Math.random() * (DROP_SPEED_MAX - DROP_SPEED_MIN);
          const mult = columnSpeedMultiplier(i, mx, fontSize);
          drops[i] += base * mult;
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      cancelAnimationFrame(frameRef.current);
    };
  }, [fontSize, fadeAlpha]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      role="presentation"
    />
  );
}
