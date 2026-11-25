import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export type Finish = "mirror" | "satin" | "patina";

// Finishes tint and scale the Cycles-baked colour/roughness maps inside each GLB.
export const FINISHES: Record<Finish, { tint: string; roughness: number; metalness: number }> = {
  mirror: { tint: "#ffffff", roughness: 1, metalness: 1 },
  satin: { tint: "#eadcca", roughness: 2.6, metalness: 1 },
  patina: { tint: "#8fa58a", roughness: 3.4, metalness: 0.55 },
};

export type StageOptions = {
  model: string;
  flames?: boolean;
  drag?: boolean;
  autoRotate?: number; // radians per second
  camera?: [number, number, number];
  target?: [number, number, number];
  fov?: number;
  onReady?: () => void;
};

// Lamp geometry constants mirrored from the Blender script (lostwax_v2.py, spout_tip()).
const TIERS: [number, number][] = [
  [0.3, 0.2],
  [0.5, 0.15],
  [0.7, 0.105],
];

function spoutTips() {
  const out: { pos: THREE.Vector3; tier: number }[] = [];
  const tilt = (70 * Math.PI) / 180;
  TIERS.forEach(([zc, R], tier) => {
    for (let i = 0; i < 5; i++) {
      const a = (2 * Math.PI * i) / 5 + 0.3;
      const bx = R * Math.cos(a);
      const by = R * Math.sin(a);
      const bz = zc + 0.034;
      const d = [Math.sin(tilt) * Math.cos(a), Math.sin(tilt) * Math.sin(a), Math.cos(tilt)];
      const tx = bx + d[0] * 0.058;
      const ty = by + d[1] * 0.058;
      const tz = bz + d[2] * 0.058 + 0.03;
      // Blender Z-up -> three Y-up
      out.push({ pos: new THREE.Vector3(tx, tz, -ty), tier });
    }
  });
  return out;
}

function flameTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 84, 2, 32, 74, 60);
  grad.addColorStop(0, "rgba(255,250,225,1)");
  grad.addColorStop(0.18, "rgba(255,210,120,0.95)");
  grad.addColorStop(0.45, "rgba(255,120,40,0.55)");
  grad.addColorStop(1, "rgba(255,80,20,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(32, 2);
  g.bezierCurveTo(60, 60, 58, 120, 32, 124);
  g.bezierCurveTo(6, 120, 4, 60, 32, 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class BronzeStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private root = new THREE.Group();
  private pivot = new THREE.Group();
  private mats: THREE.MeshStandardMaterial[] = [];
  private flames: { sprite: THREE.Sprite; tier: number; seed: number }[] = [];
  private glow: THREE.PointLight;
  private clock = new THREE.Clock();
  private raf = 0;
  private visible = true;
  private disposed = false;
  private rotTarget = 0;
  private rot = 0;
  private tiltTarget = 0;
  private tilt = 0;
  private extraSpin = 0;
  private tiers = 3;
  private swing = 0;
  private swingVel = 0;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private dragging = false;
  private lastX = 0;
  private opts: StageOptions;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, opts: StageOptions) {
    this.canvas = canvas;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // neutral room first, swapped for the same HDRI the Cycles renders use once it loads
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    new EXRLoader().load("/env/interior.exr", (tex) => {
      if (this.disposed) return;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = pmrem.fromEquirectangular(tex).texture;
      this.scene.environmentIntensity = 0.9;
      this.scene.environmentRotation.set(0, Math.PI * 0.6, 0);
      tex.dispose();
      pmrem.dispose();
    });

    this.camera = new THREE.PerspectiveCamera(opts.fov ?? 32, 1, 0.05, 50);
    const [cx, cy, cz] = opts.camera ?? [0, 0.62, 2.4];
    this.camera.position.set(cx, cy, cz);
    const [tx, ty, tz] = opts.target ?? [0, 0.55, 0];
    this.camera.lookAt(tx, ty, tz);

    const key = new THREE.DirectionalLight(0xffd2a6, 2.2);
    key.position.set(2, 3, 2);
    const rim = new THREE.DirectionalLight(0xff8a4a, 2.6);
    rim.position.set(-2.5, 1.5, -2);
    this.glow = new THREE.PointLight(0xff8a3a, opts.flames ? 1.6 : 0, 2.2, 1.6);
    this.glow.position.set(0, 0.6, 0.15);
    this.scene.add(key, rim, this.glow);

    this.pivot.add(this.root);
    this.scene.add(this.pivot);

    new GLTFLoader().load(opts.model, (gltf) => {
      if (this.disposed) return;
      gltf.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (!this.mats.includes(mat)) {
          mat.envMapIntensity = 1;
          this.mats.push(mat);
        }
      });
      this.root.add(gltf.scene);
      if (opts.flames) this.addFlames();
      this.applyTiers();
      this.setFinish(this.finish);
      opts.onReady?.();
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.loop();
    });
    this.io.observe(canvas);
    if (opts.drag) this.bindDrag();
    this.resize();
    this.loop();
  }

  private addFlames() {
    const tex = flameTexture();
    spoutTips().forEach(({ pos, tier }, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.position.copy(pos);
      s.scale.set(0.034, 0.068, 1);
      this.root.add(s);
      this.flames.push({ sprite: s, tier, seed: i * 1.7 });
    });
  }

  private bindDrag() {
    const c = this.canvas;
    c.style.touchAction = "pan-y";
    c.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      this.rotTarget += (e.clientX - this.lastX) * 0.012;
      this.lastX = e.clientX;
    });
    const up = () => (this.dragging = false);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
  }

  private resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    if (!this.dragging && this.opts.autoRotate) this.rotTarget += this.opts.autoRotate * dt;
    this.rot += (this.rotTarget + this.extraSpin - this.rot) * Math.min(1, dt * 4);
    this.tilt += (this.tiltTarget - this.tilt) * Math.min(1, dt * 3);
    this.root.rotation.y = this.rot;
    // bell swing: damped spring around the top ring
    this.swingVel += (-this.swing * 38 - this.swingVel * 2.2) * dt;
    this.swing += this.swingVel * dt;
    this.pivot.rotation.z = this.swing;
    this.pivot.rotation.x = this.tilt;
    for (const f of this.flames) {
      const k = 1 + Math.sin(t * 13 + f.seed) * 0.12 + Math.sin(t * 7.3 + f.seed * 2) * 0.08;
      f.sprite.scale.set(0.034 * (2 - k) * 0.95, 0.068 * k, 1);
    }
    if (this.opts.flames) this.glow.intensity = this.lit ? (0.6 + this.tiers * 0.45) * (1 + Math.sin(t * 11) * 0.06) : 0;
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  private applyTiers() {
    ["lamp_tier2", "lamp_tier3"].forEach((name, i) => {
      const o = this.root.getObjectByName(name);
      if (o) o.visible = this.tiers >= i + 2;
    });
    this.flames.forEach((f) => (f.sprite.visible = this.lit && f.tier < this.tiers));
  }

  private lit = true;

  /** light or snuff the wick flames (and their glow) */
  setLit(on: boolean) {
    this.lit = on;
    this.applyTiers();
  }

  setTiers(n: number) {
    this.tiers = n;
    this.applyTiers();
  }

  setFinish(f: Finish) {
    this.finish = f;
    const v = FINISHES[f];
    for (const m of this.mats) {
      m.color.set(v.tint);
      m.roughness = v.roughness;
      m.metalness = v.metalness;
    }
  }

  private finish: Finish = "mirror";

  setScale(s: number) {
    this.root.scale.setScalar(s);
  }

  /** extra rotation driven by scroll, in radians */
  setSpin(r: number) {
    this.extraSpin = r;
  }

  /** -1..1 pointer position, gently tilts the piece toward the viewer */
  setPointer(x: number, y: number) {
    this.rotTarget += x * 0.002;
    this.tiltTarget = y * 0.08;
  }

  ring() {
    this.swingVel += 2.4;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.mats.forEach((m) => m.dispose());
    this.renderer.dispose();
  }
}
