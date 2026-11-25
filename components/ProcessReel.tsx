"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters, KILN_WINDOW, POUR_WINDOW } from "@/content/site";
import { useSite } from "@/lib/providers";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const FILM = {
  // 21:9 plate composed with the subject right of centre; text owns the left third
  desktop: "/video/casting-wide.mp4",
  mobile: "/video/casting-mobile.mp4",
  poster: "/img/casting-poster.webp",
};

/**
 * The signature scene: one continuous Cycles-rendered casting film (H.264, short GOP),
 * scrubbed by scroll while the section is pinned. The file is fetched once into a blob
 * so every seek is local and instant.
 */
export function ProcessReel() {
  const { ready, scrollTo } = useSite();
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fire = useRef<HTMLDivElement>(null);
  const temp = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // download the film into memory (progress shown on the rail)
  useEffect(() => {
    if (!ready || reduce || !video.current) return;
    const v = video.current;
    const url = window.matchMedia("(max-width: 767px)").matches ? FILM.mobile : FILM.desktop;
    const ctrl = new AbortController();
    let objectUrl = "";
    (async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body!.getReader();
        const parts: BlobPart[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          got += value.length;
          if (total) setLoaded(got / total);
        }
        objectUrl = URL.createObjectURL(new Blob(parts, { type: "video/mp4" }));
        v.src = objectUrl;
        setLoaded(1);
      } catch {
        if (!ctrl.signal.aborted) {
          v.src = url; // fall back to streaming
          setLoaded(1);
        }
      }
    })();
    return () => {
      ctrl.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ready, reduce]);

  useEffect(() => {
    if (!ready || reduce || !section.current || !video.current) return;
    const v = video.current;
    let target = 0;
    let raf = 0;
    let current = 0;

    // ease the playhead toward the scroll position; only seek when the decoder is free
    const tick = () => {
      if (v.duration && !v.seeking) {
        const want = target * (v.duration - 0.05);
        if (Math.abs(want - v.currentTime) > 0.008) v.currentTime = v.currentTime + (want - v.currentTime) * 0.45;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const update = (p: number) => {
      target = p;
      let ci = chapters.findIndex((c) => p >= c.from && p < c.to);
      if (ci < 0) ci = chapters.length - 1;
      const k = KILN_WINDOW;
      const f = clamp(Math.min((p - k.in + k.fade) / k.fade, (k.out + k.fade - p) / k.fade));
      if (fire.current) fire.current.style.opacity = String(f);
      if (temp.current) {
        const tp = clamp((p - POUR_WINDOW.from) / (POUR_WINDOW.to - POUR_WINDOW.from));
        temp.current.textContent = `${Math.round(20 + tp * 1130).toLocaleString("en-IN")} °C`;
        temp.current.style.opacity = ci === 3 ? "1" : "0";
      }
      chapters.forEach((ch, i) => {
        const el = fills.current[i];
        if (el) el.style.transform = `scaleY(${clamp((p - ch.from) / (ch.to - ch.from))})`;
      });
      if (ci !== current) {
        current = ci;
        setActive(ci);
      }
    };

    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "+=700%",
      pin: true,
      anticipatePin: 1,
      onUpdate: (s) => update(s.progress),
    });
    trigger.current = st;
    update(0);
    return () => {
      cancelAnimationFrame(raf);
      st.kill();
      trigger.current = null;
    };
  }, [ready, reduce]);

  const jump = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    scrollTo(st.start + (chapters[i].from + 0.01) * (st.end - st.start));
  };

  if (reduce) {
    return (
      <section id="process" aria-label="How a piece is made" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8">
        <h2 className="display mb-10 text-4xl md:text-6xl">How a piece is made.</h2>
        <video src={FILM.desktop} poster={FILM.poster} controls muted playsInline className="mb-14 aspect-video w-full bg-coal" />
        <ol className="grid gap-8 md:grid-cols-2">
          {chapters.map((c) => (
            <li key={c.key}>
              <h3 className="text-2xl font-bold">{c.title}</h3>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-mute">{c.body}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section id="process" ref={section} aria-label="How a piece is made" className="relative h-[100dvh] overflow-hidden bg-void">
      <video
        ref={video}
        poster={FILM.poster}
        muted
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover object-[58%_50%]"
        aria-hidden="true"
      />

      <div ref={fire} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
        <img src="/img/kiln.webp" alt="" className="kiln-live h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(11,12,13,0.85))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(11,12,13,0.92),transparent_45%),linear-gradient(to_right,rgba(11,12,13,0.6),transparent_40%)]" />

      <div
        ref={temp}
        className="pointer-events-none absolute right-4 top-20 font-mono text-[clamp(2.5rem,7vw,5.5rem)] font-medium tabular-nums text-molten opacity-0 transition-opacity duration-500 md:right-28 md:top-24"
        aria-hidden="true"
      >
        20 °C
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-4 pb-12 md:px-8 md:pb-16">
        <div className="relative min-h-[11rem] max-w-[34rem] md:min-h-[12rem]">
          {chapters.map((c, i) => (
            <div
              key={c.key}
              aria-hidden={i !== active}
              className={`absolute inset-x-0 bottom-0 transition-all duration-700 ease-out ${
                i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
              }`}
            >
              <h2 className="display text-[clamp(2rem,4.6vw,3.6rem)]">{c.title}</h2>
              <p className="mt-4 max-w-[46ch] leading-relaxed text-mute md:text-lg">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {loaded < 1 && (
        <div className="absolute left-4 top-20 font-mono text-xs text-mute md:left-8" role="status">
          Loading film {Math.round(loaded * 100)}%
        </div>
      )}

      <nav aria-label="Process chapters" className="absolute right-4 top-1/2 hidden -translate-y-1/2 md:right-8 md:block">
        <ol className="grid gap-5">
          {chapters.map((c, i) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => jump(i)}
                className={`flex items-center gap-3 text-sm transition-colors ${i === active ? "text-bone" : "text-mute hover:text-bone"}`}
                aria-current={i === active ? "step" : undefined}
              >
                <span className="relative block h-8 w-px overflow-hidden bg-line">
                  <span
                    ref={(el) => {
                      fills.current[i] = el;
                    }}
                    className="absolute inset-0 origin-top scale-y-0 bg-molten"
                  />
                </span>
                {c.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
