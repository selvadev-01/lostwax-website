"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CTA } from "@/content/site";
import { useSite } from "@/lib/providers";
import { Embers } from "@/components/Embers";

/**
 * Hero: full-bleed Cycles film. The lit lamp stands still while the camera drifts on a
 * closed arc (8 s seamless H.264 loop), composed on a 21:9 plate with the subject right
 * of centre so the headline owns the dark left side.
 */
export function Hero() {
  const { ready, scrollTo } = useSite();
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    // pick the lighter encode on phones before the first byte loads
    if (window.matchMedia("(max-width: 767px)").matches) v.src = "/video/hero-mobile.mp4";
    v.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !section.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-line > span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09 });
      gsap.from(".hero-fade", { opacity: 0, y: 16, duration: 0.9, ease: "power3.out", delay: 0.45, stagger: 0.08 });
      gsap.fromTo(".hero-film", { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.2, ease: "power3.out" });
      // scroll-out lives on wrappers (never on the intro targets) with explicit start values,
      // so scrolling back to the top always restores a fully visible hero
      gsap.fromTo(
        ".hero-film-wrap",
        { scale: 1, opacity: 1 },
        {
          scale: 1.06,
          opacity: 0.35,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
        }
      );
      gsap.fromTo(
        ".hero-copy",
        { yPercent: 0, opacity: 1 },
        {
          yPercent: -30,
          opacity: 0,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: section.current, start: "top top", end: "70% top", scrub: true },
        }
      );
    }, section);
    return () => ctx.revert();
  }, [ready]);

  const go = (target: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollTo(target);
  };

  return (
    <section ref={section} className="relative min-h-[100dvh] overflow-hidden bg-void">
      <div id="top-sentinel" className="absolute top-0 h-px w-full" />
      <div className="hero-film-wrap absolute inset-0">
        <video
          ref={video}
          className="hero-film h-full w-full object-cover object-[60%_50%]"
          src="/video/hero-film.mp4"
          poster="/img/hero-film-poster.webp"
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <Embers originX={0.6} />
      </div>
      {/* legibility: darken only where the copy sits */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(11,12,13,0.85)_0%,rgba(11,12,13,0.45)_38%,transparent_62%),linear-gradient(to_top,#0b0c0d_0%,transparent_28%)] max-md:bg-[linear-gradient(to_top,#0b0c0d_8%,rgba(11,12,13,0.7)_45%,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="hero-copy relative mx-auto flex min-h-[100dvh] max-w-[1400px] items-end px-4 pb-16 pt-24 md:items-center md:px-8 md:pb-10">
        <div className="max-w-[48rem]">
          <h1 className="display text-[clamp(2.5rem,5vw,4.6rem)]">
            <span className="hero-line block overflow-hidden pb-1">
              <span className="block">Bronze, poured</span>
            </span>
            <span className="hero-line block overflow-hidden pb-2">
              <span className="block">
                by <em className="not-italic text-molten">hand.</em>
              </span>
            </span>
          </h1>
          <p className="hero-fade mt-6 max-w-[44ch] text-base leading-relaxed text-bone/75 md:text-lg">
            Lamps, bells and vessels cast in clay moulds that are broken once. No two pieces are ever alike.
          </p>
          <div className="hero-fade mt-9 flex flex-wrap gap-3">
            <a href="#commission" onClick={go("#commission")} className="bg-molten px-6 py-3.5 font-semibold text-void transition-transform active:scale-[0.98]">
              {CTA}
            </a>
            <a
              href="#process"
              onClick={go("#process")}
              className="border border-bone/25 bg-void/30 px-6 py-3.5 font-semibold text-bone backdrop-blur-sm transition-colors hover:border-bone"
            >
              Watch it being made
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
