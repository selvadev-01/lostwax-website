"use client";

import { useState } from "react";

// Raw casting vs finished piece, same Blender camera, revealed with a drag handle.
export function Polish() {
  const [pos, setPos] = useState(50);

  return (
    <section aria-labelledby="polish-h" className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-4 py-28 md:grid-cols-12 md:px-8 md:py-40">
      <div className="relative md:col-span-6 lg:col-span-5">
        <div className="relative aspect-[4/5] w-full select-none overflow-hidden bg-coal">
          <img src="/img/polish_raw.webp" alt="The lamp straight out of the mould, dark and rough" className="absolute inset-0 h-full w-full object-cover" />
          <img
            src="/img/polish_mirror.webp"
            alt="The same lamp after polishing, bright mirror bronze"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          />
          <div className="pointer-events-none absolute inset-y-0 w-px bg-molten" style={{ left: `${pos}%` }} aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 border border-molten bg-void/70 backdrop-blur" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Compare the raw casting with the polished piece"
            className="range-molten absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
        <div className="mt-3 flex justify-between font-mono text-xs text-mute">
          <span>As cast</span>
          <span>Finished</span>
        </div>
      </div>

      <div className="md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
        <h2 id="polish-h" className="display text-[clamp(2.4rem,5vw,4.2rem)]">
          Out of the clay, it looks like a rock.
        </h2>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-mute">
          Weeks of filing, chasing and hand polishing bring the bronze back to light. Drag across the lamp to see the difference.
        </p>
      </div>
    </section>
  );
}
