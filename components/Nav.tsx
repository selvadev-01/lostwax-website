"use client";

import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { nav, CTA } from "@/content/site";
import { useSite } from "@/lib/providers";

export function Nav() {
  const { scrollTo } = useSite();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => setSolid(!e.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        solid || open ? "border-b border-line bg-void/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <a href="#main" onClick={go("#main")} className="text-lg font-extrabold tracking-tight" style={{ fontStretch: "125%" }}>
          LOSTWAX
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={go(n.href)} className="text-sm text-mute transition-colors hover:text-bone">
              {n.label}
            </a>
          ))}
          <a
            href="#commission"
            onClick={go("#commission")}
            className="bg-molten px-4 py-2 text-sm font-semibold text-void transition-transform active:scale-[0.98]"
          >
            {CTA}
          </a>
        </nav>
        <button
          type="button"
          className="p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} weight="regular" /> : <List size={24} weight="regular" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="flex flex-col gap-1 border-t border-line px-4 pb-6 pt-2 md:hidden">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={go(n.href)} className="py-3 text-2xl font-bold" style={{ fontStretch: "115%" }}>
              {n.label}
            </a>
          ))}
          <a href="#commission" onClick={go("#commission")} className="mt-3 bg-molten px-4 py-3 text-center font-semibold text-void">
            {CTA}
          </a>
        </nav>
      )}
    </header>
  );
}
