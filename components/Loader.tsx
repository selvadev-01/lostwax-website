"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSite } from "@/lib/providers";

// A molten line draws the wordmark, fills it, then the curtain lifts.
export function Loader() {
  const { setReady } = useSite();
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      setGone(true);
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setGone(true),
      });
      tl.fromTo(".lw-stroke", { strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" })
        .fromTo(".lw-fill", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, "-=0.3")
        .fromTo(".lw-bar", { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: "power2.inOut" }, 0)
        .add(() => setReady(true), "+=0.15")
        .to(root.current, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, "<");
    }, root);
    return () => ctx.revert();
  }, [setReady]);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-void" aria-hidden="true">
      <svg viewBox="0 0 640 110" className="w-[min(78vw,640px)]">
        <defs>
          <linearGradient id="lw-molten" x1="0" x2="1">
            <stop offset="0" stopColor="#ffb36b" />
            <stop offset="0.5" stopColor="#ff6b2c" />
            <stop offset="1" stopColor="#c9461a" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="82"
          textAnchor="middle"
          className="lw-fill"
          fill="#ece7df"
          style={{ fontSize: 96, fontWeight: 800, fontStretch: "125%", letterSpacing: "-0.03em", fontFamily: "var(--font-archivo)" }}
        >
          LOSTWAX
        </text>
        <text
          x="50%"
          y="82"
          textAnchor="middle"
          className="lw-stroke"
          fill="none"
          stroke="url(#lw-molten)"
          strokeWidth={1.6}
          strokeDasharray={900}
          style={{ fontSize: 96, fontWeight: 800, fontStretch: "125%", letterSpacing: "-0.03em", fontFamily: "var(--font-archivo)" }}
        >
          LOSTWAX
        </text>
      </svg>
      <div className="mt-8 h-px w-40 bg-line">
        <div className="lw-bar h-px origin-left bg-molten" />
      </div>
    </div>
  );
}
