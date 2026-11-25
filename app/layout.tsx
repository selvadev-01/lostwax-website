import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3400";
const description =
  "Bronze lamps, bells and vessels cast by hand with the lost-wax method. Every mould is broken once, so every piece is the only one.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "LOSTWAX | Hand-cast bronze",
  description,
  openGraph: {
    title: "LOSTWAX | Hand-cast bronze",
    description,
    images: [{ url: "/img/lamp.webp", width: 1000, height: 1250, alt: "A three-tier bronze oil lamp" }],
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0b0c0d" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "LOSTWAX",
  description,
  makesOffer: ["Tiered Lamp", "Temple Bell", "Floating Bowl", "Round Vessel"].map((name) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Product", name, material: "Bronze" },
  })),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <body className="grain bg-void font-sans text-bone antialiased">
        <a
          href="#main"
          className="sr-only bg-molten px-5 py-3 font-semibold text-void focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90]"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
