"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The craft, in one frame: the hands-carving film with a single line of copy.
 * The process reel above already shows carve, coat, fire, pour, break and polish,
 * so this section does not repeat those steps.
 */
export function Makers() {
  const root = useRef<HTMLElement>(null);
  const hands = useRef<HTMLVideoElement>(null);

  // the carving film plays only while it is on screen; still image for reduced motion
  useEffect(() => {
    const v = hands.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload === "none") {
            v.preload = "auto";
            v.load();
          }
          v.play().catch(() => {});
        } else v.pause();
      },
      { rootMargin: "200px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hands-video",
        { scale: 1.12 },
        { scale: 1, ease: "none", scrollTrigger: { trigger: ".hands-band", start: "top bottom", end: "bottom top", scrub: true } }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="craft" ref={root} aria-labelledby="craft-h">
      <div className="hands-band relative h-[86dvh] min-h-[30rem] overflow-hidden">
        <video
          ref={hands}
          className="hands-video absolute inset-0 h-full w-full object-cover"
          poster="/img/hands.webp"
          muted
          loop
          playsInline
          preload="none"
          aria-label="Hands carving petal details into an amber beeswax lamp"
        >
          <source src="/video/hands.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#0b0c0d,rgba(11,12,13,0.1)_55%),linear-gradient(to_right,rgba(11,12,13,0.7),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
          <h2 id="craft-h" className="display max-w-[16ch] text-[clamp(2.2rem,5vw,4.2rem)]">
            Three pairs of hands on every piece.
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-bone/75">
            No machine shapes the form. Every line is carved, poured and polished by a person.
          </p>
        </div>
      </div>
    </section>
  );
}
