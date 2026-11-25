export const nav = [
  { label: "Process", href: "#process" },
  { label: "Collection", href: "#collection" },
  { label: "Craft", href: "#craft" },
  { label: "Commission", href: "#commission" },
];

export const CTA = "Commission a piece";

export type Chapter = { key: string; name: string; title: string; body: string; from: number; to: number };

// The casting film is one continuous 520-frame Cycles render; windows are fractions of it.
const F = (frame: number) => frame / 520;

export const chapters: Chapter[] = [
  {
    key: "carve",
    name: "Carve",
    title: "Every piece begins as wax.",
    body: "Our sculptors carve each form in beeswax, by hand. For now, the wax is the piece.",
    from: 0,
    to: F(88),
  },
  {
    key: "coat",
    name: "Coat",
    title: "Then it vanishes into clay.",
    body: "Layer after layer of fine river clay is pressed around the wax and left to dry for days.",
    from: F(88),
    to: F(172),
  },
  {
    key: "fire",
    name: "Fire",
    title: "Fire takes the wax away.",
    body: "In the kiln the wax melts and runs out, leaving a perfect hollow. This is the lost wax.",
    from: F(172),
    to: F(236),
  },
  {
    key: "pour",
    name: "Pour",
    title: "Bronze fills the space.",
    body: "Molten bronze is poured into the hot mould in one steady stream. There is no second try.",
    from: F(236),
    to: F(320),
  },
  {
    key: "break",
    name: "Break",
    title: "The mould is broken. Only once.",
    body: "To free the bronze, the clay is cracked away. The mould is gone, so the piece can never be repeated.",
    from: F(320),
    to: F(428),
  },
  {
    key: "polish",
    name: "Polish",
    title: "Then weeks of polish.",
    body: "Filing, chasing and burnishing by hand until the bronze holds the flame like a mirror.",
    from: F(428),
    to: 1,
  },
];

// kiln photograph crossfades over the film during the firing chapter
export const KILN_WINDOW = { in: F(184), out: F(228), fade: 0.025 };
export const POUR_WINDOW = { from: F(250), to: F(305) };

export type Piece = {
  id: string;
  name: string;
  line: string;
  from: number;
  img: string;
  model: string;
  camera: [number, number, number];
  target: [number, number, number];
};

export const pieces: Piece[] = [
  {
    id: "lamp",
    name: "Tiered Lamp",
    line: "Fifteen flames on three tiers. Our signature piece.",
    from: 18500,
    img: "/img/lamp.webp",
    model: "/models/lamp.glb",
    camera: [0, 0.62, 2.5],
    target: [0, 0.55, 0],
  },
  {
    id: "bell",
    name: "Temple Bell",
    line: "A long, clean ring that hangs in the air.",
    from: 9200,
    img: "/img/bell_wide.webp",
    model: "/models/bell.glb",
    camera: [0, 0.3, 1.3],
    target: [0, 0.25, 0],
  },
  {
    id: "urli",
    name: "Floating Bowl",
    line: "Wide and shallow, made for water and flowers.",
    from: 12400,
    img: "/img/urli.webp",
    model: "/models/urli.glb",
    camera: [0, 0.55, 1.25],
    target: [0, 0.05, 0],
  },
  {
    id: "vessel",
    name: "Round Vessel",
    line: "A full, round body with a rolled lip.",
    from: 10800,
    img: "/img/vessel.webp",
    model: "/models/vessel.glb",
    camera: [0, 0.3, 1.2],
    target: [0, 0.19, 0],
  },
];


export const config = {
  tiers: [
    { value: 1, label: "One tier", price: 18500 },
    { value: 2, label: "Two tiers", price: 27900 },
    { value: 3, label: "Three tiers", price: 38400 },
  ],
  sizes: [
    { value: "table", label: "Table", cm: 45, mult: 1, scale: 0.82, weeks: 6 },
    { value: "floor", label: "Floor", cm: 90, mult: 1.9, scale: 1, weeks: 8 },
    { value: "temple", label: "Temple", cm: 150, mult: 3.4, scale: 1.14, weeks: 12 },
  ],
  finishes: [
    { value: "mirror", label: "Mirror", add: 0 },
    { value: "satin", label: "Satin", add: 0 },
    { value: "patina", label: "Patina", add: 4500 },
  ],
} as const;

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
