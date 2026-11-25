"use client";

import { useEffect, useRef, useState } from "react";
import { BronzeStage } from "@/lib/bronze";
import { nav } from "@/content/site";

// Bell partials (hum, prime, tierce, quint, nominal...) as ratios of the strike note.
const PARTIALS = [
  [0.5, 0.5, 6],
  [1, 0.9, 4.5],
  [1.183, 0.45, 3.2],
  [1.506, 0.35, 2.6],
  [2, 0.55, 2.2],
  [2.514, 0.2, 1.6],
  [3.011, 0.16, 1.2],
];

function strike(ac: AudioContext) {
  const base = 392;
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.22;
  master.connect(ac.destination);
  for (const [ratio, amp, decay] of PARTIALS) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = base * ratio;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + decay + 0.1);
  }
}

export function Footer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<BronzeStage | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (!canvas.current) return;
    stage.current = new BronzeStage(canvas.current, {
      model: "/models/bell.glb",
      camera: [0, 0.32, 1.45],
      target: [0, 0.26, 0],
      autoRotate: 0.1,
    });
    return () => {
      stage.current?.dispose();
      stage.current = null;
    };
  }, []);

  const ring = () => {
    stage.current?.ring();
    try {
      audio.current ??= new AudioContext();
      strike(audio.current);
    } catch {
      /* audio unavailable: the bell still swings */
    }
    const id = Date.now();
    setRipples((r) => [...r.slice(-3), id]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 1700);
  };

  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-4 pt-20 md:grid-cols-12 md:px-8">
        <div className="relative md:col-span-5">
          <button type="button" onClick={ring} className="relative block w-full" aria-label="Ring the bronze bell">
            <span
              className="pointer-events-none absolute inset-x-[10%] bottom-0 h-[40%] bg-[radial-gradient(ellipse_45%_35%_at_50%_75%,rgba(255,140,60,0.18),transparent_75%)]"
              aria-hidden="true"
            />
            <canvas ref={canvas} className="pointer-events-none relative block h-[46dvh] w-full" aria-hidden="true" />
            {ripples.map((id) => (
              <span
                key={id}
                className="ripple pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] rounded-full border border-molten/60"
                aria-hidden="true"
              />
            ))}
          </button>
          <p className="text-center text-sm text-mute">Tap the bell. Sound on.</p>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="display text-[clamp(2.6rem,6vw,5rem)]">Every piece is the only one.</p>
          <p className="mt-6 max-w-[44ch] text-lg text-mute">
            Studio visits by appointment. Write to{" "}
            <a href="mailto:studio@lostwax.example" className="text-bone underline decoration-molten underline-offset-4">
              studio@lostwax.example
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto mt-20 flex max-w-[1400px] flex-col gap-6 border-t border-line px-4 py-8 text-sm text-mute md:flex-row md:items-center md:justify-between md:px-8">
        <span className="font-extrabold text-bone" style={{ fontStretch: "125%" }}>
          LOSTWAX
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-bone">
              {n.label}
            </a>
          ))}
        </nav>
        <span>&copy; 2026 LOSTWAX</span>
      </div>
    </footer>
  );
}
