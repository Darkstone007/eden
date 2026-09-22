import { useEffect, useRef } from "react";
import { CONTINENTS, MAP_NODES, PALETTE } from "./canon";
import { createWorld, interp, loadArena, worldStep, type ArenaId, type InputState, type World } from "./sim";
import { useGame } from "./store";

type Sheet = { img: HTMLImageElement; cols: number; rows: number; ok: boolean };

const SHEETS: Record<string, { src: string; cols: number; rows: number }> = {
  "azrael-walk": { src: "/sprites/azrael-walk.png", cols: 4, rows: 4 },
  "azrael-attack": { src: "/sprites/azrael-attack.png", cols: 2, rows: 2 },
  heartgrim: { src: "/sprites/heartgrim.png", cols: 2, rows: 2 },
  serpent: { src: "/sprites/serpent.png", cols: 2, rows: 2 },
  regulator: { src: "/sprites/regulator.png", cols: 2, rows: 2 },
  anima: { src: "/sprites/anima.png", cols: 2, rows: 2 },
  kima: { src: "/sprites/kima.png", cols: 2, rows: 2 },
  dual: { src: "/sprites/dual.png", cols: 2, rows: 2 },
};

function loadSheets() {
  const out: Record<string, Sheet> = {};
  for (const [k, v] of Object.entries(SHEETS)) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const sheet: Sheet = { img, cols: v.cols, rows: v.rows, ok: false };
    img.onload = () => {
      sheet.ok = true;
    };
    img.src = v.src;
    out[k] = sheet;
  }
  return out;
}

function drawSheet(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet | undefined,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number,
  flash = false,
) {
  if (!sheet?.ok) {
    ctx.fillStyle = flash ? PALETTE.paper : PALETTE.anima;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const cw = sheet.img.width / sheet.cols;
  const ch = sheet.img.height / sheet.rows;
  ctx.save();
  if (flash) ctx.filter = "brightness(2.4)";
  ctx.drawImage(sheet.img, col * cw, row * ch, cw, ch, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const inputRef = useRef<InputState>({
    keys: new Set(),
    mx: 0,
    my: 0,
    fireKima: false,
    fireAnima: false,
    fireDual: false,
    dash: false,
    interact: false,
    stickX: 0,
    stickY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const world = createWorld();
    worldRef.current = world;
    loadArena(world, "elysara");
    const sheets = loadSheets();
    const bgs = new Map<string, HTMLImageElement>();
    const loadBg = (src: string) => {
      if (bgs.has(src)) return bgs.get(src)!;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      bgs.set(src, img);
      return img;
    };
    loadBg(world.bg);
    CONTINENTS.forEach((c) => loadBg(c.bg));
    loadBg("/art/world.jpg");
    loadBg("/art/elysara-fields.jpg");

    const input = inputRef.current;
    const setKey = (code: string, down: boolean) => {
      if (down) input.keys.add(code);
      else input.keys.delete(code);
    };

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      setKey(e.code, e.type === "keydown");
      if (e.type === "keydown" && (e.code === "KeyE" || e.code === "Space")) input.interact = true;
    };
    const onBlur = () => input.keys.clear();

    const screenToWorld = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      const sx = ((clientX - r.left) / r.width) * canvas.width;
      const sy = ((clientY - r.top) / r.height) * canvas.height;
      return { x: sx + world.camX - canvas.width / 2, y: sy + world.camY - canvas.height / 2 };
    };

    const onMove = (e: PointerEvent) => {
      const w = screenToWorld(e.clientX, e.clientY);
      input.mx = w.x;
      input.my = w.y;
    };
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      if (e.button === 0) input.fireKima = true;
      if (e.button === 2) input.fireAnima = true;
      if (e.button === 1) input.fireDual = true;
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 0) input.fireKima = false;
      if (e.button === 2) input.fireAnima = false;
      if (e.button === 1) input.fireDual = false;
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    const onCmd = (ev: Event) => {
      const d = (ev as CustomEvent).detail as { type: string; id?: string };
      if (d.type === "arena" && d.id) loadArena(world, d.id as ArenaId);
      if (d.type === "reset") loadArena(world, "elysara");
    };
    window.addEventListener("eden-cmd", onCmd);

    window.__controlsTest = {
      getYaw: () => world.player.facing,
      getSpeed: () => Math.hypot(world.player.vx, world.player.vy),
      getX: () => world.player.x,
      setKeys: (codes: string[]) => {
        input.keys = new Set(codes);
      },
      setSteer: (v: number) => {
        input.stickX = -v;
      },
    };
    window.__edenInput = input;

    let last = performance.now();
    let raf = 0;
    let autoT = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = useGame.getState();

      if (g.auto && g.mode === "play") {
        autoT += dt;
        if (g.story?.choices?.length && autoT > 1.6) {
          const pick = g.story.choices.find((c) => c.auto) ?? g.story.choices[0];
          g.choose(pick.id);
          autoT = 0;
        } else if (!g.story && !g.ending) {
          const p = world.player;
          const enemy = world.actors.find((a) => a.kind === "enemy" && !a.dead);
          if (enemy) {
            input.stickX = Math.sign(enemy.x - p.x) * 0.7;
            input.stickY = Math.sign(enemy.y - p.y) * 0.7;
            input.mx = enemy.x;
            input.my = enemy.y;
            input.fireAnima = autoT % 0.7 < 0.12;
            input.fireKima = autoT % 1.1 < 0.1;
            if (p.hp < 40) input.fireDual = true;
          } else if (world.interact && autoT > 2) {
            input.interact = true;
            autoT = 0;
          } else if (world.arena === "map") {
            const node = MAP_NODES[Math.floor(autoT / 4) % MAP_NODES.length];
            input.stickX = Math.sign(node.x * world.w - p.x);
            input.stickY = Math.sign(node.y * world.h - p.y);
          } else {
            input.stickX = Math.sin(autoT * 0.4);
            input.stickY = Math.cos(autoT * 0.3);
          }
        }
      }

      if (g.mode === "play") worldStep(world, input, dt);
      input.interact = false;
      input.fireKima = false;
      input.fireDual = false;

      const alpha = (world as World & { acc?: number }).acc ? ((world as World & { acc?: number }).acc ?? 0) / (1 / 60) : 1;
      const p = interp(world.player, alpha);
      const lookX = (input.mx - world.player.x) * 0.18;
      const lookY = (input.my - world.player.y) * 0.18;
      world.camX += (p.x + lookX - world.camX) * (1 - Math.exp(-6 * dt));
      world.camY += (p.y + lookY - world.camY) * (1 - Math.exp(-6 * dt));
      world.shake *= Math.exp(-8 * dt);

      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PALETTE.void;
      ctx.fillRect(0, 0, w, h);

      const shx = (Math.random() - 0.5) * world.shake;
      const shy = (Math.random() - 0.5) * world.shake;
      ctx.save();
      ctx.translate(w / 2 - world.camX + shx, h / 2 - world.camY + shy);

      const bg = bgs.get(world.bg);
      if (bg && bg.complete && bg.naturalWidth) {
        ctx.drawImage(bg, 0, 0, world.w, world.h);
        ctx.fillStyle = "rgba(5,6,10,0.28)";
        ctx.fillRect(0, 0, world.w, world.h);
      } else {
        ctx.fillStyle = "#0b0d14";
        ctx.fillRect(0, 0, world.w, world.h);
      }

      ctx.strokeStyle = "rgba(0,232,213,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(68, 68, world.w - 136, world.h - 136);

      if (world.arena === "map") {
        for (const n of MAP_NODES) {
          const x = n.x * world.w;
          const y = n.y * world.h;
          const c = CONTINENTS.find((k) => k.id === n.id);
          ctx.beginPath();
          ctx.arc(x, y, 28, 0, Math.PI * 2);
          ctx.fillStyle = n.id === "caelus" ? PALETTE.kima : PALETTE.anima;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = PALETTE.paper;
          ctx.font = "600 13px 'IBM Plex Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(c?.name ?? n.id, x, y + 46);
        }
      }

      if (world.arena === "elysara") {
        const gx = world.w * 0.86;
        const gy = world.h * 0.5;
        ctx.strokeStyle = PALETTE.anima;
        ctx.strokeRect(gx - 22, gy - 36, 44, 72);
        ctx.fillStyle = PALETTE.anima;
        ctx.font = "12px 'IBM Plex Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("FIELDS", gx, gy + 52);
      }

      if (world.arena === "caelus") {
        const doors = [
          { x: 0.3, name: "MEND", col: PALETTE.anima },
          { x: 0.44, name: "CAGE", col: PALETTE.kima },
          { x: 0.58, name: "ROAD", col: PALETTE.paper },
          { x: 0.72, name: "SHATTER", col: PALETTE.kima },
        ];
        for (const d of doors) {
          const x = d.x * world.w;
          const y = world.h * 0.4;
          ctx.fillStyle = d.col;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x - 18, y - 48, 36, 80);
          ctx.globalAlpha = 1;
          ctx.fillStyle = PALETTE.paper;
          ctx.font = "11px 'IBM Plex Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(d.name, x, y + 48);
        }
      }

      for (const s of world.sparks) {
        if (!s.alive) continue;
        ctx.globalAlpha = Math.max(0, s.ttl / s.max);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const s of world.shots) {
        if (!s.alive) continue;
        const ip = interp(s, alpha);
        if (s.kind === "anima") {
          const col = Math.floor(world.animT * 10) % 2;
          const row = Math.floor(world.animT * 10) % 2;
          drawSheet(ctx, sheets.anima, col, row, ip.x, ip.y, 36);
        } else if (s.kind === "kima") {
          drawSheet(ctx, sheets.kima, 1, 0, ip.x, ip.y, 86);
        } else {
          drawSheet(ctx, sheets.dual, 1, 1, ip.x, ip.y, 180);
        }
      }

      const drawables = world.actors
        .filter((a) => !a.dead)
        .sort((a, b) => a.y - b.y);
      for (const a of drawables) {
        const ip = interp(a, alpha);
        if (a.kind === "player") {
          const moving = Math.hypot(world.player.vx, world.player.vy) > 28;
          if (moving) drawSheet(ctx, sheets["azrael-walk"], world.player.frame, world.player.dir, ip.x, ip.y, 72, world.iFrame > 0);
          else drawSheet(ctx, sheets["azrael-walk"], 0, world.player.dir, ip.x, ip.y, 72, world.iFrame > 0);
        } else if (a.sheet === "heartgrim") {
          drawSheet(ctx, sheets.heartgrim, a.frame % 2, Math.floor(a.frame / 2), ip.x, ip.y, 88, a.flash > 0);
        } else if (a.sheet === "serpent") {
          drawSheet(ctx, sheets.serpent, a.frame % 2, Math.floor(a.frame / 2), ip.x, ip.y, 160, a.flash > 0);
        } else {
          drawSheet(ctx, sheets.regulator, a.frame % 2, Math.floor(a.frame / 2), ip.x, ip.y, 70, a.flash > 0);
        }
        if (a.kind === "enemy") {
          ctx.fillStyle = "rgba(5,6,10,0.7)";
          ctx.fillRect(ip.x - 22, ip.y - a.r - 16, 44, 4);
          ctx.fillStyle = a.weak === "anima" ? PALETTE.anima : PALETTE.kima;
          ctx.fillRect(ip.x - 22, ip.y - a.r - 16, 44 * (a.hp / a.max), 4);
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("eden-cmd", onCmd);
      delete window.__controlsTest;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none bg-void"
      aria-label="Eden"
    />
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX?: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
    __edenInput?: InputState;
  }
}
