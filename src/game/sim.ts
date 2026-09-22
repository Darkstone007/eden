import { CONTINENTS, MAP_NODES, PALETTE, PATHS, pickEnding, type Continent } from "./canon";
import type { ContinentId, PathId } from "./types";
import { useGame } from "./store";

export type InputState = {
  keys: Set<string>;
  mx: number;
  my: number;
  fireKima: boolean;
  fireAnima: boolean;
  fireDual: boolean;
  dash: boolean;
  interact: boolean;
  stickX: number;
  stickY: number;
};

export type Body = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  r: number;
};

export type Actor = Body & {
  kind: "player" | "npc" | "enemy";
  hp: number;
  max: number;
  sheet: string;
  frame: number;
  dir: number;
  facing: number;
  flash: number;
  cd: number;
  resist: "kima" | "anima" | "none";
  weak: "kima" | "anima";
  tag: string;
  dead: boolean;
};

export type Shot = Body & {
  alive: boolean;
  kind: "anima" | "kima" | "dual";
  ttl: number;
  dmg: number;
  fromPlayer: boolean;
};

export type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  max: number;
  color: string;
  r: number;
  alive: boolean;
};

export type ArenaId = ContinentId | "elysara-fields";

export type World = {
  arena: ArenaId;
  w: number;
  h: number;
  bg: string;
  player: Actor;
  actors: Actor[];
  shots: Shot[];
  sparks: Spark[];
  camX: number;
  camY: number;
  shake: number;
  hitStop: number;
  kima: number;
  anima: number;
  kimaCd: number;
  animaCd: number;
  dualCd: number;
  dashT: number;
  iFrame: number;
  animT: number;
  cleared: boolean;
  path: PathId | null;
  interact: string | null;
};

const STEP = 1 / 60;
const MAX_SHOTS = 48;
const MAX_SPARKS = 96;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function len(x: number, y: number) {
  return Math.hypot(x, y);
}

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y);
  if (l < 1e-6) return [0, 0];
  return [x / l, y / l];
}

function circleAabb(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const px = clamp(cx, x, x + w);
  const py = clamp(cy, y, y + h);
  const dx = cx - px;
  const dy = cy - py;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  const d = Math.sqrt(d2) || 0.0001;
  return { nx: dx / d, ny: dy / d, pen: r - d };
}

function body(x: number, y: number, r: number): Body {
  return { x, y, px: x, py: y, vx: 0, vy: 0, r };
}

function actor(partial: Omit<Actor, "px" | "py" | "vx" | "vy" | "flash" | "cd" | "dead" | "frame" | "dir">): Actor {
  return {
    ...body(partial.x, partial.y, partial.r),
    ...partial,
    frame: 0,
    dir: 2,
    flash: 0,
    cd: 0,
    dead: false,
  };
}

function poolShots(): Shot[] {
  return Array.from({ length: MAX_SHOTS }, () => ({
    ...body(0, 0, 8),
    alive: false,
    kind: "anima",
    ttl: 0,
    dmg: 0,
    fromPlayer: true,
  }));
}

function poolSparks(): Spark[] {
  return Array.from({ length: MAX_SPARKS }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ttl: 0,
    max: 1,
    color: PALETTE.anima,
    r: 2,
    alive: false,
  }));
}

function spark(world: World, x: number, y: number, color: string, n = 10, speed = 220) {
  let spawned = 0;
  for (const s of world.sparks) {
    if (s.alive) continue;
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.4 + Math.random());
    s.x = x;
    s.y = y;
    s.vx = Math.cos(a) * sp;
    s.vy = Math.sin(a) * sp;
    s.ttl = 0.28 + Math.random() * 0.25;
    s.max = s.ttl;
    s.color = color;
    s.r = 2 + Math.random() * 3;
    s.alive = true;
    if (++spawned >= n) break;
  }
}

function fireShot(
  world: World,
  x: number,
  y: number,
  dx: number,
  dy: number,
  kind: Shot["kind"],
  fromPlayer: boolean,
  speed: number,
  dmg: number,
  r: number,
) {
  const [nx, ny] = norm(dx, dy);
  for (const s of world.shots) {
    if (s.alive) continue;
    s.x = x + nx * 22;
    s.y = y + ny * 22;
    s.px = s.x;
    s.py = s.y;
    s.vx = nx * speed;
    s.vy = ny * speed;
    s.r = r;
    s.kind = kind;
    s.ttl = 1.15;
    s.dmg = dmg;
    s.fromPlayer = fromPlayer;
    s.alive = true;
    return;
  }
}

function continentOf(id: ArenaId): Continent | undefined {
  const key = id === "elysara-fields" ? "elysara" : id;
  return CONTINENTS.find((c) => c.id === key);
}

function arenaSize(id: ArenaId) {
  if (id === "map") return { w: 2800, h: 1680, bg: "/art/world.jpg" };
  if (id === "elysara-fields") return { w: 2600, h: 1600, bg: "/art/elysara-fields.jpg" };
  const c = continentOf(id);
  return { w: 2400, h: 1500, bg: c?.bg ?? "/art/elysara-echoes.jpg" };
}

export function createWorld(): World {
  const player = actor({
    kind: "player",
    x: 420,
    y: 780,
    r: 18,
    hp: 100,
    max: 100,
    sheet: "azrael-walk",
    facing: 0,
    resist: "none",
    weak: "anima",
    tag: "Azrael",
  });
  return {
    arena: "elysara",
    w: 2400,
    h: 1500,
    bg: "/art/elysara-echoes.jpg",
    player,
    actors: [player],
    shots: poolShots(),
    sparks: poolSparks(),
    camX: player.x,
    camY: player.y,
    shake: 0,
    hitStop: 0,
    kima: 42,
    anima: 42,
    kimaCd: 0,
    animaCd: 0,
    dualCd: 0,
    dashT: 0,
    iFrame: 0,
    animT: 0,
    cleared: false,
    path: null,
    interact: null,
  };
}

export function loadArena(world: World, id: ArenaId) {
  const size = arenaSize(id);
  world.arena = id;
  world.w = size.w;
  world.h = size.h;
  world.bg = size.bg;
  world.cleared = false;
  world.interact = null;
  world.shots.forEach((s) => (s.alive = false));
  world.sparks.forEach((s) => (s.alive = false));
  const p = world.player;
  p.hp = p.max;
  p.dead = false;
  p.vx = 0;
  p.vy = 0;
  p.x = size.w * 0.28;
  p.y = size.h * 0.62;
  p.px = p.x;
  p.py = p.y;
  world.actors = [p];

  if (id === "map") {
    p.x = size.w * 0.62;
    p.y = size.h * 0.4;
    p.px = p.x;
    p.py = p.y;
    return;
  }

  if (id === "elysara") {
    world.actors.push(
      actor({
        kind: "npc",
        x: size.w * 0.55,
        y: size.h * 0.52,
        r: 20,
        hp: 1,
        max: 1,
        sheet: "heartgrim",
        facing: 0,
        resist: "none",
        weak: "anima",
        tag: "Heartgrim",
      }),
    );
    return;
  }

  const c = continentOf(id);
  const isBoss = id === "elysara-fields";
  const count = isBoss ? 1 : id === "caelus" ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const boss = isBoss && i === 0;
    world.actors.push(
      actor({
        kind: "enemy",
        x: size.w * 0.62 + Math.cos(ang) * 180,
        y: size.h * 0.42 + Math.sin(ang) * 140,
        r: boss ? 46 : 22,
        hp: boss ? 120 : 42,
        max: boss ? 120 : 42,
        sheet: boss || c?.enemy === "serpent" ? "serpent" : "regulator",
        facing: 0,
        resist: c?.resist ?? "kima",
        weak: c?.weak ?? "anima",
        tag: boss ? "Wind Serpent" : "Regulator",
      }),
    );
  }
}

function walls(world: World) {
  const m = 70;
  return [
    { x: 0, y: 0, w: world.w, h: m },
    { x: 0, y: world.h - m, w: world.w, h: m },
    { x: 0, y: 0, w: m, h: world.h },
    { x: world.w - m, y: 0, w: m, h: world.h },
  ];
}

function resolveWalls(b: Body, world: World) {
  for (const w of walls(world)) {
    const hit = circleAabb(b.x, b.y, b.r, w.x, w.y, w.w, w.h);
    if (!hit) continue;
    b.x += hit.nx * hit.pen;
    b.y += hit.ny * hit.pen;
    const vdot = b.vx * hit.nx + b.vy * hit.ny;
    if (vdot < 0) {
      b.vx -= vdot * hit.nx;
      b.vy -= vdot * hit.ny;
    }
  }
  b.x = clamp(b.x, b.r + 8, world.w - b.r - 8);
  b.y = clamp(b.y, b.r + 8, world.h - b.r - 8);
}

function separate(a: Actor, b: Actor) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const min = a.r + b.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= min * min || d2 < 1e-6) return;
  const d = Math.sqrt(d2);
  const pen = (min - d) * 0.5;
  const nx = dx / d;
  const ny = dy / d;
  if (a.kind !== "npc") {
    a.x -= nx * pen;
    a.y -= ny * pen;
  }
  if (b.kind !== "npc") {
    b.x += nx * pen;
    b.y += ny * pen;
  }
}

function damage(world: World, target: Actor, raw: number, kind: "kima" | "anima" | "dual") {
  if (target.dead) return;
  let m = 1;
  if (kind !== "dual") {
    if (target.resist === kind) m *= 0.55;
    if (target.weak === kind) m *= 1.35;
  } else m *= 1.5;
  const path = useGame.getState().path;
  if (kind === "kima" && path === "forged") m *= 1.2;
  if (kind === "anima" && path === "lapis") m *= 1.2;
  if (kind === "dual" && path === "crucible") m *= 1.15;
  target.hp -= raw * m;
  target.flash = 0.12;
  world.shake = Math.max(world.shake, kind === "dual" ? 10 : 5);
  world.hitStop = Math.max(world.hitStop, kind === "dual" ? 0.06 : 0.03);
  spark(world, target.x, target.y, kind === "kima" ? PALETTE.kima : PALETTE.anima, kind === "dual" ? 18 : 8);
  if (target.hp <= 0) {
    target.dead = true;
    target.hp = 0;
    spark(world, target.x, target.y, PALETTE.paper, 22, 280);
  }
}

function dirFrom(dx: number, dy: number) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 1 : 2;
  return dy < 0 ? 3 : 0;
}

function physicsStep(world: World, input: InputState, dt: number) {
  const g = useGame.getState();
  if (g.paused || g.ending) {
    g.setHud({
      hp: world.player.hp,
      max: world.player.max,
      kima: world.kima,
      anima: world.anima,
      continent: world.arena === "elysara-fields" ? "elysara" : world.arena === "map" ? "map" : (world.arena as ContinentId),
      interact: world.interact,
    });
    return;
  }
  const p = world.player;
  if (g.path && world.path !== g.path) {
    const wells = PATHS[g.path];
    world.kima = wells.kima;
    world.anima = wells.anima;
  }
  world.path = g.path;

  let ix = input.stickX;
  let iy = input.stickY;
  if (input.keys.has("KeyW") || input.keys.has("ArrowUp")) iy -= 1;
  if (input.keys.has("KeyS") || input.keys.has("ArrowDown")) iy += 1;
  if (input.keys.has("KeyA") || input.keys.has("ArrowLeft")) ix -= 1;
  if (input.keys.has("KeyD") || input.keys.has("ArrowRight")) ix += 1;
  const il = Math.hypot(ix, iy);
  if (il > 1) {
    ix /= il;
    iy /= il;
  }

  const accel = 2400;
  const maxSp = world.dashT > 0 ? 520 : 240;
  p.vx += ix * accel * dt;
  p.vy += iy * accel * dt;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > maxSp) {
    p.vx = (p.vx / sp) * maxSp;
    p.vy = (p.vy / sp) * maxSp;
  }
  const friction = world.dashT > 0 ? 1.2 : 7.5;
  p.vx -= p.vx * friction * dt;
  p.vy -= p.vy * friction * dt;

  const aimDx = input.mx - p.x;
  const aimDy = input.my - p.y;
  p.facing = Math.atan2(aimDy, aimDx);
  if (il > 0.2) p.dir = dirFrom(ix, iy);
  else p.dir = dirFrom(Math.cos(p.facing), Math.sin(p.facing));

  if ((input.dash || input.keys.has("ShiftLeft") || input.keys.has("ShiftRight")) && world.dashT <= 0 && world.iFrame <= 0) {
    const [nx, ny] = il > 0.2 ? [ix, iy] : norm(Math.cos(p.facing), Math.sin(p.facing));
    p.vx += nx * 420;
    p.vy += ny * 420;
    world.dashT = 0.16;
    world.iFrame = 0.22;
    spark(world, p.x, p.y, PALETTE.paper, 6, 140);
  }

  world.kima = clamp(world.kima + 10 * dt, 0, 100);
  world.anima = clamp(world.anima + 10 * dt, 0, 100);
  world.kimaCd = Math.max(0, world.kimaCd - dt);
  world.animaCd = Math.max(0, world.animaCd - dt);
  world.dualCd = Math.max(0, world.dualCd - dt);
  world.dashT = Math.max(0, world.dashT - dt);
  world.iFrame = Math.max(0, world.iFrame - dt);

  const wantKima = input.fireKima || input.keys.has("KeyJ") || input.keys.has("Digit1");
  const wantAnima = input.fireAnima || input.keys.has("KeyK") || input.keys.has("Digit2");
  const wantDual = input.fireDual || input.keys.has("KeyL") || input.keys.has("KeyQ") || input.keys.has("Digit3");

  if (wantKima && world.kimaCd <= 0 && world.kima >= 22) {
    world.kima -= 22;
    world.kimaCd = 0.38;
    const [nx, ny] = norm(aimDx, aimDy);
    fireShot(world, p.x, p.y, nx, ny, "kima", true, 0, 18, 34);
    const slash = world.shots.find((s) => s.alive && s.kind === "kima" && s.ttl > 1);
    if (slash) {
      slash.x = p.x + nx * 36;
      slash.y = p.y + ny * 36;
      slash.vx = p.vx;
      slash.vy = p.vy;
      slash.ttl = 0.18;
    }
    spark(world, p.x + nx * 40, p.y + ny * 40, PALETTE.kima, 10, 180);
  }
  if (wantAnima && world.animaCd <= 0 && world.anima >= 22) {
    world.anima -= 22;
    world.animaCd = 0.28;
    fireShot(world, p.x, p.y, aimDx, aimDy, "anima", true, 520, 16, 9);
    spark(world, p.x, p.y, PALETTE.anima, 4, 80);
  }
  if (wantDual && world.dualCd <= 0 && world.kima >= 40 && world.anima >= 40) {
    world.kima -= 40;
    world.anima -= 40;
    world.dualCd = 3.2;
    fireShot(world, p.x, p.y, 0, 0, "dual", true, 0, 28, 120);
    const nova = world.shots.find((s) => s.alive && s.kind === "dual");
    if (nova) {
      nova.x = p.x;
      nova.y = p.y;
      nova.ttl = 0.35;
    }
    spark(world, p.x, p.y, PALETTE.anima, 16, 260);
    spark(world, p.x, p.y, PALETTE.kima, 16, 260);
    g.tickMeters(2, 2, "Dual Pulse · the System hates this");
  }

  p.px = p.x;
  p.py = p.y;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  resolveWalls(p, world);

  for (const a of world.actors) {
    if (a.kind === "player" || a.dead) continue;
    a.cd = Math.max(0, a.cd - dt);
    a.flash = Math.max(0, a.flash - dt);
    a.px = a.x;
    a.py = a.y;
    if (a.kind === "enemy") {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const [nx, ny] = norm(dx, dy);
      const speed = a.sheet === "serpent" ? 92 : 130;
      a.vx = nx * speed;
      a.vy = ny * speed;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.facing = Math.atan2(dy, dx);
      a.dir = dirFrom(nx, ny);
      if (a.cd <= 0 && dx * dx + dy * dy < (a.r + p.r + 18) ** 2 && world.iFrame <= 0) {
        p.hp -= a.sheet === "serpent" ? 9 : 6;
        world.iFrame = 0.35;
        world.shake = 7;
        p.vx -= nx * 220;
        p.vy -= ny * 220;
        a.cd = 0.9;
        spark(world, p.x, p.y, PALETTE.kima, 8);
        if (p.hp <= 0) {
          p.hp = 0;
          p.x = world.w * 0.28;
          p.y = world.h * 0.62;
          p.hp = p.max * 0.6;
          g.tickMeters(0, 4, "The hour caught you. Wells reopen.");
        }
      }
      if (a.cd <= 0 && a.sheet === "regulator" && dx * dx + dy * dy < 420 * 420) {
        fireShot(world, a.x, a.y, dx, dy, a.weak === "kima" ? "kima" : "anima", false, 280, 8, 7);
        a.cd = 1.35;
      }
    }
    resolveWalls(a, world);
  }

  for (let i = 0; i < world.actors.length; i++) {
    for (let j = i + 1; j < world.actors.length; j++) {
      const a = world.actors[i];
      const b = world.actors[j];
      if (a.dead || b.dead) continue;
      separate(a, b);
    }
  }

  for (const s of world.shots) {
    if (!s.alive) continue;
    s.px = s.x;
    s.py = s.y;
    const sub = s.kind === "anima" ? 3 : 1;
    const sdt = dt / sub;
    for (let k = 0; k < sub; k++) {
      s.x += s.vx * sdt;
      s.y += s.vy * sdt;
    }
    s.ttl -= dt;
    if (s.ttl <= 0 || s.x < -40 || s.y < -40 || s.x > world.w + 40 || s.y > world.h + 40) {
      s.alive = false;
      continue;
    }
    if (s.fromPlayer) {
      for (const a of world.actors) {
        if (a.kind !== "enemy" || a.dead) continue;
        const rr = a.r + s.r;
        if ((a.x - s.x) ** 2 + (a.y - s.y) ** 2 < rr * rr) {
          damage(world, a, s.dmg, s.kind);
          if (s.kind !== "dual") s.alive = false;
          a.vx += (a.x - p.x) * 0.8;
          a.vy += (a.y - p.y) * 0.8;
          break;
        }
      }
    } else if (world.iFrame <= 0) {
      const rr = p.r + s.r;
      if ((p.x - s.x) ** 2 + (p.y - s.y) ** 2 < rr * rr) {
        p.hp -= s.dmg;
        world.iFrame = 0.28;
        s.alive = false;
        spark(world, p.x, p.y, s.kind === "kima" ? PALETTE.kima : PALETTE.anima, 6);
      }
    }
  }

  for (const s of world.sparks) {
    if (!s.alive) continue;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.92;
    s.vy *= 0.92;
    s.ttl -= dt;
    if (s.ttl <= 0) s.alive = false;
  }

  world.animT += dt;
  if (il > 0.2) p.frame = Math.floor(world.animT * 8) % 4;
  else p.frame = 0;
  for (const a of world.actors) {
    if (a.kind === "player") continue;
    a.frame = Math.floor(world.animT * 6) % 4;
  }

  world.interact = null;
  if (world.arena === "map") {
    let nearest = 99;
    let nid: string | null = null;
    for (const n of MAP_NODES) {
      const x = n.x * world.w;
      const y = n.y * world.h;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < 70 && d < nearest) {
        nearest = d;
        nid = n.id;
      }
    }
    if (nid) {
      world.interact = nid;
      if (input.interact) g.choose(`enter-${nid}`);
    }
  } else if (world.arena === "elysara") {
    const npc = world.actors.find((a) => a.tag === "Heartgrim");
    if (npc && Math.hypot(p.x - npc.x, p.y - npc.y) < 70) {
      world.interact = "Heartgrim";
      if (input.interact && !g.story) g.choose("heartgrim-sit");
    }
    const gateX = world.w * 0.86;
    const gateY = world.h * 0.5;
    if (Math.hypot(p.x - gateX, p.y - gateY) < 64) {
      world.interact = "Azure Fields";
      if (input.interact) g.choose("fields-go");
    }
  } else if (world.arena === "caelus") {
    const doors: Array<{ id: string; x: number; y: number; name: string }> = [
      { id: "mend", x: 0.3, y: 0.42, name: "Mend" },
      { id: "lock", x: 0.44, y: 0.36, name: "Cage" },
      { id: "walk", x: 0.58, y: 0.36, name: "Road" },
      { id: "shatter", x: 0.72, y: 0.42, name: "Shatter" },
    ];
    for (const d of doors) {
      const x = d.x * world.w;
      const y = d.y * world.h;
      if (Math.hypot(p.x - x, p.y - y) < 56) {
        world.interact = d.name;
        if (input.interact) g.choose(`door-${d.id}`);
      }
    }
  }

  const liveEnemies = world.actors.filter((a) => a.kind === "enemy" && !a.dead);
  if (!world.cleared && world.arena !== "map" && world.arena !== "elysara" && liveEnemies.length === 0 && world.actors.some((a) => a.kind === "enemy")) {
    world.cleared = true;
    const c = continentOf(world.arena);
    g.remember(`cleared:${world.arena}`);
    g.tickMeters(8, 2, c ? `${c.name} held` : "Regulator down");
    if (world.arena === "elysara-fields") {
      g.choose("to-map");
    } else if (world.arena !== "caelus") {
      g.setStory({
        who: c?.name ?? "Eden",
        portrait: c?.portrait,
        text: `${c?.talk ?? "The hour thins."} Return to the world when you are ready.`,
        choices: [{ tag: "Map", label: "Open the world.", id: "open-map", auto: true }],
      });
    }
  }

  g.setHud({
    hp: p.hp,
    max: p.max,
    kima: world.kima,
    anima: world.anima,
    continent: world.arena === "elysara-fields" ? "elysara" : world.arena === "map" ? "map" : (world.arena as ContinentId),
    aimX: input.mx,
    aimY: input.my,
    interact: world.interact,
  });
}

export function worldStep(world: World, input: InputState, dt: number) {
  const cap = Math.min(dt, 0.1);
  world.hitStop = Math.max(0, world.hitStop - cap);
  if (world.hitStop > 0) return;
  (world as World & { acc?: number }).acc = ((world as World & { acc?: number }).acc ?? 0) + cap;
  let acc = (world as World & { acc?: number }).acc ?? 0;
  while (acc >= STEP) {
    for (const a of world.actors) {
      a.px = a.x;
      a.py = a.y;
    }
    physicsStep(world, input, STEP);
    acc -= STEP;
  }
  (world as World & { acc?: number }).acc = acc;
}

export function interp(b: Body, alpha: number) {
  return { x: b.px + (b.x - b.px) * alpha, y: b.py + (b.y - b.py) * alpha };
}

export function endingOf(oath: number, ctrl: number) {
  return pickEnding(oath, ctrl);
}

export { STEP };
