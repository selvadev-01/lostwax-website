"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowsClockwise, X } from "@phosphor-icons/react";
import { BronzeStage } from "@/lib/bronze";
import { pieces, inr, type Piece } from "@/content/site";

const layout = [
  "md:col-span-2 md:row-span-2 min-h-[30rem] md:min-h-0",
  "md:col-span-2 min-h-[20rem]",
  "md:col-span-1 min-h-[20rem]",
  "md:col-span-1 min-h-[20rem]",
];

function Viewer({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d || !canvas.current) return;
    d.showModal();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = new BronzeStage(canvas.current, {
      model: piece.model,
      flames: piece.id === "lamp",
      drag: true,
      autoRotate: reduce ? 0 : 0.25,
      camera: piece.camera,
      target: piece.target,
    });
    const close = () => onClose();
    d.addEventListener("close", close);
    return () => {
      d.removeEventListener("close", close);
      s.dispose();
    };
  }, [piece, onClose]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="viewer-title"
      className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-void/95 p-0 text-bone backdrop:bg-void/80"
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col px-4 py-6 md:px-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 id="viewer-title" className="display text-3xl md:text-5xl">
              {piece.name}
            </h3>
            <p className="mt-2 text-mute">
              {piece.line} From <span className="font-mono text-bone">{inr(piece.from)}</span>
            </p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="border border-line p-3 hover:border-bone" aria-label="Close 3D view">
            <X size={22} />
          </button>
        </div>
        <canvas ref={canvas} className="mt-4 block w-full flex-1 cursor-grab active:cursor-grabbing" aria-label={`${piece.name}, drag to turn`} role="img" />
        <p className="flex items-center justify-center gap-2 pb-2 text-sm text-mute">
          <ArrowsClockwise size={16} /> Drag to turn it
        </p>
      </div>
    </dialog>
  );
}

export function Collection() {
  const [open, setOpen] = useState<Piece | null>(null);

  return (
    <section id="collection" aria-labelledby="collection-h" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <h2 id="collection-h" className="display max-w-[16ch] text-[clamp(2.4rem,5vw,4.2rem)]">
        Four forms we cast all year.
      </h2>
      <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-mute">
        Each one is carved again from fresh wax, so yours will carry its own small differences.
      </p>

      <ul className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-4 md:grid-rows-[22rem_22rem]">
        {pieces.map((p, i) => (
          <li key={p.id} className={`group relative overflow-hidden bg-coal ${layout[i]}`}>
            <img
              src={p.img}
              alt={`${p.name} in polished bronze`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,12,13,0.9),transparent_55%)]" />
            <div
              className={`absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-5 md:p-6 ${
                i < 2 ? "sm:flex-row sm:items-end sm:justify-between" : ""
              }`}
            >
              <div>
                <h3 className="text-xl font-bold md:text-2xl" style={{ fontStretch: "112%" }}>
                  {p.name}
                </h3>
                <p className="mt-1 max-w-[32ch] text-sm text-mute">{p.line}</p>
                <p className="mt-2 font-mono text-sm text-bone">From {inr(p.from)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="shrink-0 border border-bone/40 bg-void/40 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-molten hover:text-molten"
              >
                View in 3D
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open && <Viewer piece={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
