"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; vy: number; sway: number; phase: number; r: number; life: number; max: number };

/**
 * The site's one ambient motion: embers rising off the lit lamp in the hero film.
 * Additive sprites on a transparent canvas, spawned around the lamp (right of centre),
 * paused when off screen, absent for reduced motion.
 */
export function Embers({ originX = 0.58 }: { originX?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d")!;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const COUNT = mobile ? 16 : 36;
    let w = 0;
    let h = 0;
    let dpr = 1;

    // one pre-rendered glow sprite, drawn additively
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const s = sprite.getContext("2d")!;
    const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,236,190,1)");
    g.addColorStop(0.25, "rgba(255,178,77,0.9)");
    g.addColorStop(0.6, "rgba(255,107,44,0.25)");
    g.addColorStop(1, "rgba(255,107,44,0)");
    s.fillStyle = g;
    s.fillRect(0, 0, 32, 32);

    const ox = mobile ? 0.5 : originX;
    const spawn = (p: Partial<P> = {}): P => ({
      x: (ox + (Math.random() - 0.5) * 0.22) * w,
      y: h * (0.62 + Math.random() * 0.3),
      vy: 14 + Math.random() * 26,
      sway: 6 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      r: 0.8 + Math.random() * 1.8,
      life: 0,
      max: 4 + Math.random() * 5,
      ...p,
    });

    const size = () => {
      dpr = Math.min(window.devicePixelRatio, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
    };
    size();
    const ps: P[] = Array.from({ length: COUNT }, () => {
      const p = spawn();
      p.life = Math.random() * p.max; // pre-warm so the first frame is not empty
      return p;
    });

    let raf = 0;
    let last = performance.now();
    let running = true;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.life += dt;
        if (p.life >= p.max) {
          ps[i] = spawn();
          continue;
        }
        const t = p.life / p.max;
        const y = p.y - p.vy * p.life;
        const x = p.x + Math.sin(p.phase + p.life * 1.3) * p.sway;
        // fade in fast, cool and fade out slowly
        const a = Math.min(1, t * 6) * (1 - t) * (1 - t);
        const d = p.r * 6 * (1 - t * 0.5);
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(cv);
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [originX]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
