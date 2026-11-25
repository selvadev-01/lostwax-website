"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

type Ctx = { scrollTo: (target: string | number) => void; ready: boolean; setReady: (v: boolean) => void };
const ScrollContext = createContext<Ctx>({ scrollTo: () => {}, ready: false, setReady: () => {} });

export const useSite = () => useContext(ScrollContext);

export function Providers({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [ready, setReady] = useState(false);

  // Lenis <-> GSAP ScrollTrigger sync (skipped entirely for reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // hold scrolling while the loader is up
  useEffect(() => {
    const l = lenisRef.current;
    if (!ready) l?.stop();
    else {
      l?.start();
      // pins are created at different times; measure them in page order
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }
  }, [ready]);

  // late layout shifts (web fonts, lazy images, pin spacers) move every trigger below them:
  // re-measure whenever the document height actually changes
  useEffect(() => {
    let last = document.documentElement.scrollHeight;
    let t = 0;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - last) < 2) return;
      last = h;
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }, 200);
    });
    ro.observe(document.body);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const scrollTo = useCallback((target: string | number) => {
    if (typeof target === "number") {
      if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.4 });
      else window.scrollTo({ top: target, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(target) as HTMLElement | null;
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return <ScrollContext.Provider value={{ scrollTo, ready, setReady }}>{children}</ScrollContext.Provider>;
}
