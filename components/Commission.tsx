"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { CheckCircle, CircleNotch, Flame } from "@phosphor-icons/react";
import { BronzeStage, type Finish } from "@/lib/bronze";
import { config, inr, CTA } from "@/content/site";

type Status = "idle" | "sending" | "sent";
type Size = (typeof config.sizes)[number]["value"];

const ENGRAVE_PRICE = 1200;
const ENGRAVE_MAX = 28;
const RULER_MAX = 180; // cm shown on the height ruler
const PERSON = 170; // reference height

// how each finish looks as a metal swatch (also used for its name in the code)
const SWATCH: Record<Finish, string> = {
  mirror: "linear-gradient(135deg,#ffe2ad 0%,#c98a4b 38%,#fff0cf 52%,#94592a 100%)",
  satin: "linear-gradient(135deg,#d2a676 0%,#a87747 55%,#8a5d34 100%)",
  patina: "linear-gradient(135deg,#8fa287 0%,#56664f 45%,#8a6a45 100%)",
};

/**
 * Accessible radio group with roving tabindex: Tab enters the group once,
 * arrow keys / Home / End move and select, exactly like native radios.
 */
function RadioGroup<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  children,
}: {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  children: (o: { value: T; label: string }, selected: boolean) => ReactNode;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = options.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div>
      <p id={id} className="mb-3 text-sm text-mute">
        {legend}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-3 gap-2">
        {options.map((o, i) => {
          const sel = o.value === value;
          return (
            <button
              key={String(o.value)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={sel}
              tabIndex={sel ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKey(e, i)}
              className={`group flex min-h-[5.5rem] flex-col items-center justify-center gap-2 border px-2 py-3 text-sm font-semibold transition-colors duration-200 ${
                sel ? "border-molten bg-molten/10 text-bone" : "border-line text-bone/80 hover:border-bone/50 hover:text-bone"
              }`}
            >
              {children(o, sel)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** stacked dishes, widest at the bottom: a literal picture of the tier count */
function TierGlyph({ n, active }: { n: number; active: boolean }) {
  const widths = [100, 72, 46].slice(0, n).reverse();
  return (
    <span className="flex h-7 flex-col items-center justify-end gap-[3px]" aria-hidden="true">
      {widths.map((w) => (
        <span key={w} className={`block h-[3px] ${active ? "bg-molten" : "bg-bone/60"}`} style={{ width: `${w * 0.34}px` }} />
      ))}
      <span className={`block h-[5px] w-[3px] ${active ? "bg-molten" : "bg-bone/60"}`} />
    </span>
  );
}

export function Commission() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<BronzeStage | null>(null);
  const priceEl = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: 0 });

  const [tiers, setTiers] = useState<1 | 2 | 3>(3);
  const [size, setSize] = useState<Size>("floor");
  const [finish, setFinish] = useState<Finish>("mirror");
  const [lit, setLit] = useState(true);
  const [engraving, setEngraving] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const s = config.sizes.find((x) => x.value === size)!;
  const tierLabel = config.tiers.find((x) => x.value === tiers)!.label;
  const finishLabel = config.finishes.find((x) => x.value === finish)!.label;
  const engraved = engraving.trim();
  const price = useMemo(() => {
    const t = config.tiers.find((x) => x.value === tiers)!;
    const f = config.finishes.find((x) => x.value === finish)!;
    return t.price * s.mult + f.add + (engraved ? ENGRAVE_PRICE : 0);
  }, [tiers, finish, s, engraved]);
  const code = `LW-${tiers}T-${s.label.toUpperCase()}-${finishLabel.toUpperCase()}${engraved ? "-E" : ""}`;

  useEffect(() => {
    if (!canvas.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage.current = new BronzeStage(canvas.current, {
      model: "/models/lamp.glb",
      flames: true,
      drag: true,
      autoRotate: reduce ? 0 : 0.12,
      camera: [0, 0.62, 2.6],
      target: [0, 0.55, 0],
    });
    return () => {
      stage.current?.dispose();
      stage.current = null;
    };
  }, []);

  useEffect(() => stage.current?.setTiers(tiers), [tiers]);
  useEffect(() => stage.current?.setFinish(finish), [finish]);
  useEffect(() => stage.current?.setScale(s.scale), [s]);
  useEffect(() => stage.current?.setLit(lit), [lit]);

  // count the estimate to its new value
  useEffect(() => {
    const el = priceEl.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = inr(price);
      shown.current.v = price;
      return;
    }
    const tw = gsap.to(shown.current, {
      v: price,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = inr(shown.current.v);
      },
    });
    return () => {
      tw.kill();
    };
  }, [price]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const next: Record<string, string> = {};
    if (name.length < 2) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) {
      (e.currentTarget.querySelector(next.name ? "#c-name" : "#c-email") as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");
    // No backend yet: simulate the request so the full state cycle is visible.
    window.setTimeout(() => setStatus("sent"), 1100);
  };

  const field = "w-full border border-line bg-coal px-4 py-3 text-bone placeholder:text-mute/70 focus:border-molten focus:outline-none";
  const pct = (cm: number) => `${(cm / RULER_MAX) * 100}%`;

  return (
    <section id="commission" aria-labelledby="commission-h" className="border-t border-line bg-coal/40">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-12">
        {/* stage: the lamp, a true-scale height ruler and the flame switch */}
        <div className="lg:col-span-6">
          <div className="relative lg:sticky lg:top-20">
            <div
              className="pointer-events-none absolute inset-x-[8%] bottom-[6%] h-[34%] transition-opacity duration-700"
              style={{
                opacity: lit ? 1 : 0.35,
                background: "radial-gradient(ellipse 50% 38% at 50% 70%, rgba(255,140,60,0.2), rgba(255,107,44,0.06) 55%, transparent 75%)",
              }}
              aria-hidden="true"
            />
            <canvas
              ref={canvas}
              className="block h-[60dvh] w-full cursor-grab active:cursor-grabbing lg:h-[80dvh]"
              role="img"
              aria-label={`Your lamp: ${tierLabel.toLowerCase()}, ${s.label.toLowerCase()} size, ${finishLabel.toLowerCase()} finish, ${lit ? "lit" : "unlit"}. Drag to turn it.`}
            />

            <button
              type="button"
              aria-pressed={lit}
              onClick={() => setLit((v) => !v)}
              className={`absolute left-0 top-0 flex min-h-[44px] items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors ${
                lit ? "border-molten/60 bg-molten/10 text-bone" : "border-line text-bone/80 hover:border-bone/50"
              }`}
            >
              <Flame size={18} weight={lit ? "fill" : "regular"} className={lit ? "text-molten" : ""} aria-hidden="true" />
              {lit ? "Lamp lit" : "Light the lamp"}
            </button>

            {/* true scale: the 3D view cannot show real size, the ruler does */}
            <figure className="absolute bottom-[8%] right-0 top-[10%] w-20" aria-label={`Height ${s.cm} centimetres, against a ${PERSON} centimetre person`}>
              <div className="absolute bottom-0 right-6 top-0 w-px bg-line" aria-hidden="true" />
              {[0, 30, 60, 90, 120, 150, 180].map((cm) => (
                <div key={cm} className="absolute right-6 flex translate-y-1/2 items-center gap-1" style={{ bottom: pct(cm) }} aria-hidden="true">
                  <span className={`font-mono text-[11px] text-mute transition-opacity ${Math.abs(cm - s.cm) < 14 ? "opacity-0" : ""}`}>{cm}</span>
                  <span className="block h-px w-2 bg-line" />
                </div>
              ))}
              <div className="absolute right-0 w-12 translate-y-1/2 border-t border-dashed border-bone/40" style={{ bottom: pct(PERSON) }} aria-hidden="true">
                <span className="absolute -top-5 right-0 whitespace-nowrap text-[11px] text-mute">Person</span>
              </div>
              <div
                className="absolute right-[18px] w-[13px] bg-molten/80 transition-[height] duration-700 ease-out"
                style={{ bottom: 0, height: pct(s.cm) }}
                aria-hidden="true"
              />
              <figcaption className="absolute right-8 translate-y-1/2 whitespace-nowrap font-mono text-sm text-molten transition-[bottom] duration-700 ease-out" style={{ bottom: pct(s.cm) }}>
                {s.cm} cm
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <h2 id="commission-h" className="display text-[clamp(2.4rem,5vw,4.2rem)]">
            Design your lamp.
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-mute">
            Choose the shape and finish. We carve it fresh in wax and cast it for you alone.
          </p>

          <div className="mt-10 grid gap-7">
            <RadioGroup legend="Tiers" options={config.tiers} value={tiers} onChange={(v) => setTiers(v as 1 | 2 | 3)}>
              {(o, sel) => (
                <>
                  <TierGlyph n={o.value as number} active={sel} />
                  {o.label}
                </>
              )}
            </RadioGroup>

            <RadioGroup legend="Size" options={config.sizes} value={size} onChange={(v) => setSize(v as Size)}>
              {(o, sel) => {
                const cm = config.sizes.find((x) => x.value === o.value)!.cm;
                return (
                  <>
                    <span className="flex h-7 items-end" aria-hidden="true">
                      <span className={`block w-[6px] ${sel ? "bg-molten" : "bg-bone/60"}`} style={{ height: `${(cm / 150) * 28}px` }} />
                    </span>
                    <span>
                      {o.label} <span className="font-mono font-normal text-mute">{cm} cm</span>
                    </span>
                  </>
                );
              }}
            </RadioGroup>

            <RadioGroup legend="Finish" options={config.finishes} value={finish} onChange={(v) => setFinish(v as Finish)}>
              {(o, sel) => (
                <>
                  <span
                    className={`block h-7 w-7 border ${sel ? "border-molten" : "border-bone/20"}`}
                    style={{ background: SWATCH[o.value as Finish] }}
                    aria-hidden="true"
                  />
                  {o.label}
                </>
              )}
            </RadioGroup>

            <div className="grid gap-2">
              <label htmlFor="c-engrave" className="text-sm text-mute">
                Engraving <span className="text-mute/70">(optional, +{inr(ENGRAVE_PRICE)})</span>
              </label>
              <input
                id="c-engrave"
                value={engraving}
                maxLength={ENGRAVE_MAX}
                onChange={(e) => setEngraving(e.target.value)}
                placeholder="A name or a date"
                aria-describedby="c-engrave-help"
                className={field}
              />
              <p id="c-engrave-help" className="text-sm text-mute">
                Hand-cut into the base. {ENGRAVE_MAX - engraving.length} characters left.
              </p>
            </div>
          </div>

          {/* the bronze plate that travels with the order */}
          <div
            className="mt-10 border border-[#6b4a2b] p-6"
            style={{ background: "linear-gradient(135deg,#2b1d12,#1a120c 60%,#24180f)" }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-xs tracking-wide text-[#c99a68]">{code}</p>
              <p className="font-mono text-xs text-[#c99a68]">Ready in {s.weeks} weeks</p>
            </div>
            <p className="mt-4 min-h-[2.2rem] break-words text-2xl font-bold uppercase tracking-[0.12em] text-[#e9c79a]" style={{ fontStretch: "118%" }}>
              {engraved || <span className="text-[#e9c79a]/30">Your engraving</span>}
            </p>
            <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#6b4a2b] pt-4">
              <p className="text-sm text-[#c99a68]">
                {tierLabel}, {s.label} {s.cm} cm, {finishLabel}
              </p>
              <p className="font-mono text-2xl text-molten">
                <span ref={priceEl}>{inr(price)}</span>
              </p>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {`${tierLabel}, ${s.label} ${s.cm} centimetres, ${finishLabel} finish${engraved ? ", engraved" : ""}. Estimate ${inr(price)}, ready in ${s.weeks} weeks.`}
          </p>

          {status === "sent" ? (
            <div role="status" className="mt-10 border border-molten/50 bg-molten/10 p-6">
              <CheckCircle size={28} className="text-molten" aria-hidden="true" />
              <p className="mt-3 text-xl font-bold">Request received.</p>
              <p className="mt-2 text-mute">
                We reply within two working days with sketches and a final price for {code}.
              </p>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="mt-10 grid gap-5" aria-label="Commission request">
              <input type="hidden" name="config" value={code} />
              <input type="hidden" name="engraving" value={engraved} />
              <div className="grid gap-2">
                <label htmlFor="c-name" className="text-sm">
                  Your name
                </label>
                <input
                  id="c-name"
                  name="name"
                  autoComplete="name"
                  className={field}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "c-name-err" : undefined}
                />
                {errors.name && (
                  <p id="c-name-err" className="text-sm text-molten">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="c-email" className="text-sm">
                  Email
                </label>
                <input
                  id="c-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={field}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "c-email-err" : undefined}
                />
                {errors.email && (
                  <p id="c-email-err" className="text-sm text-molten">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="c-notes" className="text-sm">
                  Anything we should know
                </label>
                <textarea id="c-notes" name="notes" rows={3} className={field} aria-describedby="c-notes-help" />
                <p id="c-notes-help" className="text-sm text-mute">
                  A room, an occasion, a motif you love. Optional.
                </p>
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-2 flex min-h-[52px] items-center justify-center gap-2 bg-molten px-6 py-4 font-semibold text-void transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {status === "sending" && <CircleNotch size={18} className="animate-spin" aria-hidden="true" />}
                {status === "sending" ? "Sending" : CTA}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
