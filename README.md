# LOSTWAX: Hand-cast bronze

**Live site:** https://lostwax-website.vercel.app

Store website for LOSTWAX: bronze lamps, bells and vessels cast by hand with the lost-wax method. Every mould is broken once, so every piece is the only one.

Next.js 14 (App Router) · TypeScript · Tailwind · GSAP · Lenis · Three.js · Phosphor Icons.

```bash
npm install
npm run dev        # http://localhost:3400
npm run build && npm start
```

Set `NEXT_PUBLIC_SITE_URL` to the live domain (used for Open Graph URLs).

## Where things live

| What | Where |
|---|---|
| Page sections | `components/` (Hero, ProcessReel, Collection, Makers, Commission, Footer) |
| 3D bronze material | `lib/bronze.ts` |
| Site copy and products | `content/site.ts` |
| Lenis + GSAP setup | `lib/providers.tsx` |
| 3D models and environment map | `public/models/`, `public/env/` |
| Images, frame sequence, videos | `public/img/`, `public/seq/`, `public/video/` |

## Deployment

Deployed on Vercel (project `lostwax-website`).
