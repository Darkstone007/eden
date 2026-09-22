import { useEffect, useRef, useState } from "react";
import { PATHS } from "./canon";
import { sfx } from "./audio";
import { useGame } from "./store";
import type { FightDef, Well } from "./types";

type Phase = "idle" | "telegraph" | "strike";

export function CombatStage({ fight }: { fight: FightDef }) {
  const finish = useGame((s) => s.finishCombat);
  const auto = useGame((s) => s.auto);
  const path = useGame((s) => s.path);
  const wells = path ? PATHS[path] : { kima: 50, anima: 50 };
  const [hp, setHp] = useState(fight.hp);
  const [php, setPhp] = useState(100);
  const [kima, setKima] = useState(wells.kima);
  const [anima, setAnima] = useState(wells.anima);
  const [phase, setPhase] = useState<Phase>("idle");
  const [tel, setTel] = useState<Well>("anima");
  const [flash, setFlash] = useState<Well | "hurt" | null>(null);
  const [log, setLog] = useState(fight.hint);
  const [shake, setShake] = useState(0);

  const hpR = useRef(fight.hp);
  const phpR = useRef(100);
  const kimaR = useRef(wells.kima);
  const animaR = useRef(wells.anima);
  const phaseR = useRef<Phase>("idle");
  const telR = useRef<Well>("anima");
  const accR = useRef(0);
  const doneR = useRef(false);
  const finishR = useRef(finish);
  finishR.current = finish;
  const autoR = useRef(auto);
  autoR.current = auto;

  function paintLog(t: string) {
    setLog(t);
  }

  function strike(kind: Well) {
    if (doneR.current || hpR.current <= 0) return;
    if (kind === "kima" && kimaR.current < 20) return;
    if (kind === "anima" && animaR.current < 20) return;
    if (kind === "dual" && (kimaR.current < 38 || animaR.current < 38)) return;

    if (kind === "kima") kimaR.current -= 22;
    if (kind === "anima") animaR.current -= 22;
    if (kind === "dual") {
      kimaR.current -= 40;
      animaR.current -= 40;
    }
    setKima(kimaR.current);
    setAnima(animaR.current);

    if (kind === "kima") sfx.kima();
    else if (kind === "anima") sfx.anima();
    else sfx.dual();

    let dmg = kind === "dual" ? 34 : 18;
    if (kind !== "dual") {
      if (fight.resist === kind) dmg *= 0.5;
      if (fight.weak === kind) dmg *= 1.45;
    } else dmg *= 1.35;
    if (path === "forged" && kind === "kima") dmg *= 1.2;
    if (path === "lapis" && kind === "anima") dmg *= 1.2;
    if (path === "crucible" && kind === "dual") dmg *= 1.15;
    if (phaseR.current === "telegraph" && (kind === telR.current || kind === "dual")) dmg *= 1.25;

    hpR.current = Math.max(0, hpR.current - dmg);
    setHp(hpR.current);
    setFlash(kind);
    setShake(kind === "dual" ? 14 : 7);
    paintLog(
      kind === "dual"
        ? "Dual Pulse. The System hates this."
        : kind === fight.weak
          ? `${kind === "anima" ? "Anima" : "Kima"} finds the weakness.`
          : `${kind === "anima" ? "Anima" : "Kima"} meets resistance.`,
    );
    phaseR.current = "idle";
    setPhase("idle");
    accR.current = 0;
    window.setTimeout(() => setFlash(null), 220);

    if (hpR.current <= 0) {
      doneR.current = true;
      window.setTimeout(() => finishR.current(true), 640);
    }
  }

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let paintAcc = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (doneR.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      kimaR.current = Math.min(100, kimaR.current + 12 * dt);
      animaR.current = Math.min(100, animaR.current + 12 * dt);
      accR.current += dt;
      paintAcc += dt;
      if (paintAcc > 0.08) {
        setKima(kimaR.current);
        setAnima(animaR.current);
        setShake((s) => s * 0.55);
        paintAcc = 0;
      }

      if (phpR.current <= 0) {
        phpR.current = 60;
        setPhp(60);
        paintLog("The hour caught you. Wells reopen.");
        finishR.current(false);
      }

      if (phaseR.current === "idle" && accR.current > 0.9) {
        const next: Well = Math.random() < 0.58 ? fight.weak : fight.weak === "anima" ? "kima" : "anima";
        telR.current = next;
        setTel(next);
        phaseR.current = "telegraph";
        setPhase("telegraph");
        paintLog(next === "kima" ? "Body gathers in the lattice." : "Soul threads the crack.");
        accR.current = 0;
      } else if (phaseR.current === "telegraph" && accR.current > 1.2) {
        phaseR.current = "strike";
        setPhase("strike");
        accR.current = 0;
      } else if (phaseR.current === "strike" && accR.current > 0.65) {
        phpR.current = Math.max(0, phpR.current - (fight.id === "smile" ? 16 : 12));
        setPhp(phpR.current);
        setFlash("hurt");
        sfx.hurt();
        setShake(10);
        paintLog("The regulation lands.");
        phaseR.current = "idle";
        setPhase("idle");
        accR.current = 0;
        window.setTimeout(() => setFlash(null), 180);
      }

      if (autoR.current && (phaseR.current === "idle" || phaseR.current === "telegraph") && accR.current > 0.5) {
        strike(fight.weak);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyJ" || e.code === "Digit1") strike("kima");
      if (e.code === "KeyK" || e.code === "Digit2") strike("anima");
      if (e.code === "KeyL" || e.code === "Digit3" || e.code === "KeyQ") strike("dual");
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        if (phaseR.current === "strike") {
          phaseR.current = "idle";
          setPhase("idle");
          accR.current = 0;
          paintLog("Step. The hour misses.");
          sfx.click();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fight, path]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-void text-paper">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={fight.id === "serpent" ? "/video/loop-serpent.mp4" : "/video/loop-pulse.mp4"}
        poster={fight.bg}
        autoPlay
        muted
        loop
        playsInline
      />
      <div
        className="ken absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-35"
        style={{
          backgroundImage: `url(${fight.bg})`,
          transform: shake ? `translateX(${((Math.random() - 0.5) * shake).toFixed(2)}px)` : undefined,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/35 to-void/40" />
      <div className="lattice pointer-events-none absolute inset-0" />
      <div className="flow-motes pointer-events-none absolute inset-0" />
      {flash === "dual" ? <div className="dual-flash absolute inset-0" /> : null}

      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-kicker text-anima">{fight.subtitle}</p>
            <h2 className="mt-1 font-display text-xl text-paper sm:text-2xl">{fight.name}</h2>
          </div>
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-md border border-line px-3 text-xs text-mute"
            onClick={() => useGame.getState().toTitle()}
          >
            Title
          </button>
        </div>
        <p className="mt-2 text-xs text-mute">{log}</p>

        <div className="flex flex-1 items-end justify-between gap-3 py-4 sm:items-center">
          <Fighter src="/art/azrael.png" name="Azrael" hp={php} max={100} flash={flash === "hurt"} align="left" />
          <div className="flex flex-col items-center gap-3">
            <div
              className={`grid size-16 place-items-center rounded-full border sm:size-20 ${
                phase === "telegraph" ? (tel === "kima" ? "border-kima bg-raised" : "border-anima bg-raised") : "border-line bg-void/50"
              }`}
            >
              <span className="text-xs uppercase tracking-kicker text-paper">
                {phase === "telegraph" ? tel : phase === "strike" ? "hit" : "pulse"}
              </span>
            </div>
          </div>
          <Fighter src={fight.foe} name={fight.foeName} hp={hp} max={fight.hp} flash={!!flash && flash !== "hurt"} align="right" />
        </div>

        <div className="rounded-lg border border-line bg-void/75 p-3 sm:p-4">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Meter label="Kima" value={kima} accent="kima" />
            <Meter label="Anima" value={anima} accent="anima" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Act label="Kima" hint="J · body" onClick={() => strike("kima")} accent="kima" disabled={kima < 20} />
            <Act label="Anima" hint="K · soul" onClick={() => strike("anima")} accent="anima" disabled={anima < 20} />
            <Act label="Dual Pulse" hint="L · both" onClick={() => strike("dual")} accent="paper" disabled={kima < 38 || anima < 38} />
            <Act
              label="Step"
              hint="Shift"
              onClick={() => {
                if (phaseR.current === "strike") {
                  phaseR.current = "idle";
                  setPhase("idle");
                  accR.current = 0;
                  paintLog("Step. The hour misses.");
                }
              }}
              accent="mute"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Fighter({
  src,
  name,
  hp,
  max,
  flash,
  align,
}: {
  src: string;
  name: string;
  hp: number;
  max: number;
  flash: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`w-[42%] max-w-xs ${align === "right" ? "text-right" : ""}`}>
      <div className="relative overflow-hidden rounded-md border border-line">
        <img
          src={src}
          alt=""
          crossOrigin="anonymous"
          className={`h-40 w-full object-cover object-top sm:h-64 ${flash ? "brightness-150" : ""} breathe`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void to-transparent p-2">
          <p className="font-display text-sm text-paper">{name}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
            <div className={`h-full ${align === "left" ? "bg-paper" : "bg-kima"}`} style={{ width: `${Math.max(0, (hp / max) * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value, accent }: { label: string; value: number; accent: "kima" | "anima" }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs uppercase tracking-kicker text-mute">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div className={`h-full ${accent === "kima" ? "bg-kima" : "bg-anima"}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function Act({
  label,
  hint,
  onClick,
  accent,
  disabled,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  accent: "kima" | "anima" | "paper" | "mute";
  disabled?: boolean;
}) {
  const color =
    accent === "kima"
      ? "border-line-kima text-kima"
      : accent === "anima"
        ? "border-line text-anima"
        : accent === "paper"
          ? "border-paper text-paper"
          : "border-line text-mute";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-md border bg-void/60 px-3 py-2 text-left disabled:opacity-40 ${color}`}
    >
      <span className="block font-display text-sm">{label}</span>
      <span className="text-xs uppercase tracking-kicker text-mute">{hint}</span>
    </button>
  );
}
