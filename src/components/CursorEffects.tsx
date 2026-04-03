import React, { useEffect, useRef } from "react";

const LERP = 0.22;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia;
  if (typeof mq !== "function") return false;
  return mq("(prefers-reduced-motion: reduce)").matches;
}

export function CursorEffects() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const move = (e: PointerEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!activeRef.current) {
        activeRef.current = true;
        posRef.current = { x: e.clientX, y: e.clientY };
        spotlightRef.current?.classList.add("cursor-effects--visible");
        cursorRef.current?.classList.add("cursor-effects--visible");
      }
    };

    const leave = () => {
      activeRef.current = false;
      spotlightRef.current?.classList.remove("cursor-effects--visible");
      cursorRef.current?.classList.remove("cursor-effects--visible");
    };

    const loop = () => {
      const t = targetRef.current;
      const p = posRef.current;
      p.x += (t.x - p.x) * LERP;
      p.y += (t.y - p.y) * LERP;

      const spot = spotlightRef.current;
      const cur = cursorRef.current;
      if (spot) {
        spot.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) translate(-50%, -50%)`;
      }
      if (cur) {
        cur.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (prefersReducedMotion()) return null;

  return (
    <>
      <div
        ref={spotlightRef}
        className="cursor-spotlight"
        aria-hidden
      />
      <div ref={cursorRef} className="cursor-ring" aria-hidden />
    </>
  );
}
