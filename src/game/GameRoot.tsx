import { Download, Map as MapIcon, Sparkles, Swords } from "lucide-react";
import { CONTINENTS, ENDINGS } from "./canon";
import { GameCanvas } from "./GameCanvas";
import { useGame } from "./store";

function beginPlay(auto: boolean) {
  useGame.getState().startPlay(auto);
}

function Meter({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "anima" | "kima" | "paper";
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-kicker text-mute">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div
          className={`h-full rounded-full ${accent === "kima" ? "bg-kima" : accent === "anima" ? "bg-anima" : "bg-paper"}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function TitleScreen() {
  const wipe = useGame((s) => s.wipe);
  const loop = useGame((s) => s.loop);
  return (
    <div className="relative flex min-h-dvh flex-col justify-end overflow-hidden bg-void">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/video/trailer.mp4"
        poster="/video/poster.jpg"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-void/25" />
      <div className="relative z-10 px-5 pb-10 pt-16 sm:px-10 sm:pb-14">
        <p className="text-[10px] uppercase tracking-kicker text-anima">Circuit Ink · Eden · seven continents</p>
        <h1 className="mt-3 max-w-[14ch] font-display text-3xl font-extrabold tracking-[-0.045em] text-paper">
          Aetherion
        </h1>
        <p className="mt-4 max-w-[46ch] text-mute">
          A god was murdered. Eden stopped trusting oaths and installed a System. Azrael Raven inherits a broken Dual
          Flow amulet. Walk the hour. Keep a table, or file the form.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="min-h-11 rounded-md bg-paper px-5 py-3 font-display text-sm text-void"
            onClick={() => beginPlay(false)}
          >
            Play Eden
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-line px-5 py-3 font-display text-sm text-paper"
            onClick={() => beginPlay(true)}
          >
            Auto-Demo
          </button>
          <a
            href="/video/trailer.mp4"
            download="Aetherion-Eden-Trailer.mp4"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-5 py-3 text-sm text-mute"
          >
            <Download className="size-4" />
            Trailer
          </a>
          <button type="button" className="min-h-11 rounded-md px-4 py-3 text-sm text-mute" onClick={wipe}>
            Clear hour
          </button>
        </div>
        <p className="mt-5 text-xs uppercase tracking-nav text-mute">Hour {loop} · WASD move · mouse aim · J Kima · K Anima · L Dual · Shift step</p>
      </div>
    </div>
  );
}

function TouchPad() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex items-end justify-between px-4 sm:hidden">
      <div
        className="pointer-events-auto relative h-28 w-28 rounded-full border border-line bg-void/60"
        onPointerDown={(e) => {
          const el = e.currentTarget;
          el.setPointerCapture(e.pointerId);
          const apply = (ev: React.PointerEvent) => {
            const r = el.getBoundingClientRect();
            const x = ((ev.clientX - r.left) / r.width) * 2 - 1;
            const y = ((ev.clientY - r.top) / r.height) * 2 - 1;
            const input = window.__edenInput;
            if (!input) return;
            input.stickX = Math.max(-1, Math.min(1, x));
            input.stickY = Math.max(-1, Math.min(1, y));
          };
          apply(e);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 2 - 1;
          const y = ((e.clientY - r.top) / r.height) * 2 - 1;
          const input = window.__edenInput;
          if (!input) return;
          input.stickX = Math.max(-1, Math.min(1, x));
          input.stickY = Math.max(-1, Math.min(1, y));
        }}
        onPointerUp={() => {
          const input = window.__edenInput;
          if (!input) return;
          input.stickX = 0;
          input.stickY = 0;
        }}
      />
      <div className="pointer-events-auto grid grid-cols-2 gap-2">
        {(
          [
            ["KeyJ", "Kima"],
            ["KeyK", "Anima"],
            ["KeyL", "Dual"],
            ["ShiftLeft", "Step"],
            ["KeyE", "Talk"],
          ] as const
        ).map(([code, label]) => (
          <button
            key={code}
            type="button"
            className="min-h-11 min-w-16 rounded-md border border-line bg-void/70 px-3 font-display text-xs text-paper"
            onPointerDown={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
            }}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayHud() {
  const oath = useGame((s) => s.oath);
  const ctrl = useGame((s) => s.ctrl);
  const cls = useGame((s) => s.cls);
  const loop = useGame((s) => s.loop);
  const toast = useGame((s) => s.toast);
  const hud = useGame((s) => s.hud);
  const toTitle = useGame((s) => s.toTitle);
  const continent = CONTINENTS.find((c) => c.id === hud.continent);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-kicker text-anima">
            Hour {loop}
            {continent ? ` · Act ${continent.act} ${continent.name}` : hud.continent === "map" ? " · Eden" : ""}
          </p>
          <p className="font-display text-lg text-paper">{cls === "UNWRITTEN" ? "Seeker" : cls}</p>
        </div>
        <button
          type="button"
          className="pointer-events-auto min-h-11 rounded-md border border-line px-3 text-xs text-mute"
          onClick={toTitle}
        >
          Title
        </button>
      </div>
      <div className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-5">
        <Meter label="Body" value={(hud.hp / hud.max) * 100} accent="paper" />
        <Meter label="Oath" value={oath} accent="anima" />
        <Meter label="Control" value={ctrl} accent="kima" />
        <Meter label="Kima" value={hud.kima} accent="kima" />
        <Meter label="Anima" value={hud.anima} accent="anima" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-kicker text-mute">
        <span className="inline-flex items-center gap-1">
          <Swords className="size-3 text-kima" /> J body
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3 text-anima" /> K soul
        </span>
        <span>L dual pulse</span>
        <span className="inline-flex items-center gap-1">
          <MapIcon className="size-3" /> E talk / door
        </span>
        {hud.interact ? <span className="text-paper">Near {hud.interact}</span> : null}
        {toast ? <span className="text-anima">{toast}</span> : null}
      </div>
    </div>
  );
}

function StoryPanel() {
  const story = useGame((s) => s.story);
  const choose = useGame((s) => s.choose);
  if (!story) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-void via-void/95 to-transparent px-4 pb-6 pt-16 sm:px-8">
      <div className="mx-auto flex max-w-3xl gap-4">
        {story.portrait ? (
          <img
            src={story.portrait}
            alt=""
            className="hidden h-28 w-20 shrink-0 object-cover sm:block"
            crossOrigin="anonymous"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] uppercase tracking-kicker ${story.sys ? "text-anima" : "text-kima"}`}>
            {story.who}
          </p>
          <p className="mt-2 max-w-[62ch] text-sm text-paper">{story.text}</p>
          {story.choices ? (
            <div className="mt-4 flex flex-col gap-2">
              {story.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="min-h-11 rounded-md border border-line bg-void/70 px-4 py-2 text-left text-sm text-paper"
                  onClick={() => choose(c.id)}
                >
                  <span className="mr-2 block text-[10px] uppercase tracking-kicker text-anima sm:inline">{c.tag}</span>
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EndingCard() {
  const ending = useGame((s) => s.ending);
  const choose = useGame((s) => s.choose);
  if (!ending) return null;
  const e = ENDINGS[ending];
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-void/70 p-6 sm:p-10">
      <div className="max-w-lg">
        <p className="text-[10px] uppercase tracking-kicker text-kima">Fracture Hour</p>
        <h2 className="mt-2 font-display text-2xl text-paper">{e.name}</h2>
        <p className="mt-3 text-mute">{e.body}</p>
        <button
          type="button"
          className="mt-6 min-h-11 rounded-md bg-paper px-5 py-3 font-display text-sm text-void"
          onClick={() => choose("hour-reset")}
        >
          Wake in the next hour
        </button>
      </div>
    </div>
  );
}

function PlayScreen() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-void">
      <GameCanvas />
      <PlayHud />
      <StoryPanel />
      <EndingCard />
      <TouchPad />
    </div>
  );
}

export function GameRoot() {
  const mode = useGame((s) => s.mode);
  return mode === "title" ? <TitleScreen /> : <PlayScreen />;
}
