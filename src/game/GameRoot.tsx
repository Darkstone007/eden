import { BookOpen, Download, Map as MapIcon, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ART_PRELOAD, CONTINENTS, ENDINGS, PEOPLE, pickEnding } from "./canon";
import { CombatStage } from "./CombatStage";
import { isMuted, setMuted, setPad, unlockAudio } from "./audio";
import { useGame } from "./store";
import type { ContinentId, StoryBeat } from "./types";

const SCENE_LOOP: Record<string, string> = {
  wake: "/video/loop-echoes.mp4",
  classed: "/video/loop-azrael.mp4",
  heartgrim: "/video/loop-heartgrim.mp4",
  "after-heartgrim": "/video/loop-echoes.mp4",
  fields: "/video/loop-serpent.mp4",
  "after-serpent": "/video/loop-pulse.mp4",
  caelus: "/video/loop-world.mp4",
  doors: "/video/loop-world.mp4",
};

function boot() {
  unlockAudio();
  ART_PRELOAD.forEach((src) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
  });
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
      <div className="mb-1 flex justify-between text-xs uppercase tracking-kicker text-mute">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}</span>
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
  const startPlay = useGame((s) => s.startPlay);
  const openCodex = useGame((s) => s.openCodex);
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
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/20" />
      <div className="lattice pointer-events-none absolute inset-0" />
      <div className="relative z-10 px-5 pb-10 pt-16 sm:px-10 sm:pb-14">
        <p className="text-xs uppercase tracking-kicker text-anima enter">Circuit Ink · Eden · seven continents</p>
        <h1 className="mt-3 max-w-[14ch] font-display text-3xl font-extrabold text-paper enter">Aetherion</h1>
        <p className="mt-4 max-w-[46ch] text-mute enter-delay">
          A god was murdered. Eden stopped trusting oaths and installed a System. Azrael Raven inherits a broken Dual
          Flow amulet and a Well in the left palm. Walk the hour. Keep a table, or file the form.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="min-h-11 rounded-md bg-paper px-5 py-3 font-display text-sm text-void"
            onClick={() => {
              boot();
              startPlay(false);
            }}
          >
            Play Hour
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-line px-5 py-3 font-display text-sm text-paper"
            onClick={() => {
              boot();
              startPlay(true);
            }}
          >
            Auto-Demo
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-5 py-3 text-sm text-mute"
            onClick={() => {
              boot();
              openCodex();
            }}
          >
            <BookOpen className="size-4" />
            Codex
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
        <p className="mt-5 text-xs uppercase tracking-nav text-mute">
          Hour {loop} · Oath / Control · Kima / Anima / Dual Pulse · Fracture Hour loops
        </p>
      </div>
    </div>
  );
}

function TypeText({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(t);
          return v;
        }
        return v + 2;
      });
    }, 16);
    return () => window.clearInterval(t);
  }, [text]);
  return (
    <p className="mt-2 max-w-[62ch] text-sm text-paper sm:text-base" onClick={() => setN(text.length)}>
      {text.slice(0, n)}
      {n < text.length ? <span className="text-anima">▌</span> : null}
    </p>
  );
}

function SceneStage({ story }: { story: StoryBeat }) {
  const choose = useGame((s) => s.choose);
  const loopSrc = SCENE_LOOP[story.id];
  return (
    <div className="relative min-h-dvh overflow-hidden bg-void">
      {loopSrc ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={loopSrc} autoPlay muted loop playsInline />
      ) : (
        <div className="ken absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${story.bg})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/30" />
      <div className="lattice pointer-events-none absolute inset-0" />
      {story.portrait ? (
        <img
          src={story.portrait}
          alt=""
          crossOrigin="anonymous"
          className="breathe pointer-events-none absolute bottom-36 right-0 hidden h-[72%] max-w-[46%] object-contain object-bottom sm:block"
        />
      ) : null}
      <PlayChrome />
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-void via-void/95 to-transparent px-4 pb-6 pt-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className={`text-xs uppercase tracking-kicker ${story.sys ? "text-anima" : "text-kima"}`}>{story.who}</p>
          <TypeText text={story.text} />
          <div className="mt-4 flex flex-col gap-2">
            {story.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className="min-h-11 rounded-md border border-line bg-void/70 px-4 py-2 text-left text-sm text-paper"
                onClick={() => choose(c.id)}
              >
                <span className="mr-2 block text-xs uppercase tracking-kicker text-anima sm:inline">{c.tag}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayChrome() {
  const oath = useGame((s) => s.oath);
  const ctrl = useGame((s) => s.ctrl);
  const cls = useGame((s) => s.cls);
  const loop = useGame((s) => s.loop);
  const toast = useGame((s) => s.toast);
  const story = useGame((s) => s.story);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const toTitle = useGame((s) => s.toTitle);
  const openCodex = useGame((s) => s.openCodex);
  const openMap = useGame((s) => s.openMap);
  const view = useGame((s) => s.view);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 sm:p-6">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-kicker text-anima">
          Hour {loop}
          {story ? ` · Act ${story.act} ${story.place}` : ""}
        </p>
        <p className="font-display text-lg text-paper">{cls === "UNWRITTEN" ? "Seeker" : cls}</p>
        {toast ? <p className="mt-1 text-xs text-anima">{toast}</p> : null}
        <div className="mt-3 grid w-52 grid-cols-2 gap-3">
          <Meter label="Oath" value={oath} accent="anima" />
          <Meter label="Control" value={ctrl} accent="kima" />
        </div>
      </div>
      <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          {view !== "map" ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-3 text-xs text-mute"
              onClick={openMap}
            >
              <MapIcon className="size-3" />
              Eden
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-3 text-xs text-mute"
            onClick={openCodex}
          >
            <BookOpen className="size-3" />
            Codex
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-3 text-xs text-mute"
            onClick={() => {
              const next = !isMuted();
              setMuted(next);
              toggleMute();
            }}
          >
            {muted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
            {muted ? "Muted" : "Sound"}
          </button>
          <button type="button" className="min-h-11 rounded-md border border-line px-3 text-xs text-mute" onClick={toTitle}>
            Title
          </button>
        </div>
    </div>
  );
}

function MapStage() {
  const enter = useGame((s) => s.enterContinent);
  const visited = useGame((s) => s.visited);
  const auto = useGame((s) => s.auto);
  const close = useGame((s) => s.closeOverlay);

  const others = visited.filter((v) => v !== "elysara" && v !== "caelus");
  const caelusOpen = others.length >= 2 || auto;

  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => {
      const next = CONTINENTS.find((c) => c.id !== "elysara" && c.id !== "caelus" && !visited.includes(c.id));
      if (next) enter(next.id);
      else enter("caelus");
    }, 1600);
    return () => window.clearTimeout(t);
  }, [auto, visited, enter]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-void">
      <div className="ken absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/art/world.jpg)" }} />
      <video className="absolute inset-0 h-full w-full object-cover opacity-80" src="/video/loop-world.mp4" autoPlay muted loop playsInline />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/40" />
      <PlayChrome />
      <div className="relative z-10 flex min-h-dvh flex-col justify-end px-4 pb-5 pt-28 sm:px-8">
        <p className="text-xs uppercase tracking-kicker text-anima">Eden · seven inhabited continents</p>
        <p className="mt-2 max-w-[54ch] text-sm text-mute">
          Walk the world. Caelus Prime opens after two continents beyond Elysara. The hour will wait.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {CONTINENTS.map((c) => {
            const locked = c.id === "caelus" && !caelusOpen;
            const done = visited.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={locked}
                onClick={() => enter(c.id as ContinentId)}
                className="overflow-hidden rounded-md border border-line bg-void/70 text-left disabled:opacity-40"
              >
                <img src={c.bg} alt="" crossOrigin="anonymous" className="h-20 w-full object-cover sm:h-24" />
                <div className="p-2">
                  <span className={`inline-block size-2 rounded-full ${done ? "bg-anima" : locked ? "bg-mute" : "bg-kima"}`} />
                  <p className="mt-1 font-display text-xs text-paper sm:text-sm">{c.name}</p>
                  <p className="text-xs uppercase tracking-kicker text-mute">
                    Act {c.act}
                    {locked ? " · locked" : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <button type="button" className="mt-4 min-h-11 w-fit rounded-md border border-line px-4 text-sm text-paper" onClick={close}>
          Back
        </button>
      </div>
    </div>
  );
}

function CodexStage() {
  const people = useGame((s) => s.people);
  const visited = useGame((s) => s.visited);
  const memories = useGame((s) => s.memories);
  const loop = useGame((s) => s.loop);
  const oath = useGame((s) => s.oath);
  const ctrl = useGame((s) => s.ctrl);
  const cls = useGame((s) => s.cls);
  const toTitle = useGame((s) => s.toTitle);
  const close = useGame((s) => s.closeOverlay);
  const mode = useGame((s) => s.mode);
  const known = PEOPLE.filter((p) => people.includes(p.id) || p.id === "azrael");
  const door = pickEnding(oath, ctrl);

  return (
    <div className="min-h-dvh overflow-y-auto bg-void text-paper">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <p className="text-xs uppercase tracking-kicker text-anima">Codex · Hour {loop}</p>
        <h2 className="mt-2 font-display text-2xl">Aetherion · Eden</h2>
        <p className="mt-3 max-w-[60ch] text-sm text-mute">
          Class {cls === "UNWRITTEN" ? "unwritten" : cls}. The meters have been listening. Suggested door: {ENDINGS[door].name}.
        </p>
        <div className="mt-6 grid max-w-md grid-cols-2 gap-4">
          <Meter label="Oath" value={oath} accent="anima" />
          <Meter label="Control" value={ctrl} accent="kima" />
        </div>
        <h3 className="mt-10 font-display text-lg">People</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {known.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-lg border border-line bg-ink">
              <img src={p.image} alt="" crossOrigin="anonymous" className="h-40 w-full object-cover object-top" />
              <div className="p-4">
                <p className="text-xs uppercase tracking-kicker text-anima">{p.title}</p>
                <h4 className="mt-1 font-display text-paper">{p.name}</h4>
                <p className="mt-2 text-sm text-mute">{p.line}</p>
              </div>
            </article>
          ))}
        </div>
        <h3 className="mt-10 font-display text-lg">Continents walked</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {CONTINENTS.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
              <span className={`size-2 rounded-full ${visited.includes(c.id) ? "bg-anima" : "bg-mute"}`} />
              <span className="font-display text-sm">
                Act {c.act} · {c.name}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-10 font-display text-lg">Memories that persist</h3>
        <p className="mt-2 text-sm text-mute">
          {Object.keys(memories).length ? Object.keys(memories).join(" · ") : "The body resets. The Well does not."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {mode === "play" ? (
            <button type="button" className="min-h-11 rounded-md bg-paper px-5 font-display text-sm text-void" onClick={close}>
              Return
            </button>
          ) : null}
          <button type="button" className="min-h-11 rounded-md border border-line px-5 text-sm text-paper" onClick={toTitle}>
            Title
          </button>
        </div>
      </div>
    </div>
  );
}

function EndingCard() {
  const ending = useGame((s) => s.ending);
  const choose = useGame((s) => s.choose);
  const loop = useGame((s) => s.loop);
  if (!ending) return null;
  const e = ENDINGS[ending];
  return (
    <div className="relative min-h-dvh overflow-hidden bg-void">
      <div className="ken absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${e.bg})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/70 to-void/40" />
      <div className="relative z-10 flex min-h-dvh flex-col justify-end px-5 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-kicker text-kima">Fracture Hour · {loop}</p>
        <h2 className="mt-2 font-display text-2xl text-paper sm:text-3xl">{e.name}</h2>
        <p className="mt-2 text-xs uppercase tracking-kicker text-mute">{e.need}</p>
        <p className="mt-4 max-w-[54ch] text-mute">{e.body}</p>
        <p className="mt-4 max-w-[54ch] text-sm text-anima">The body resets. The Well does not. Wake in the next hour.</p>
        <button
          type="button"
          className="mt-6 min-h-11 w-fit rounded-md bg-paper px-5 py-3 font-display text-sm text-void"
          onClick={() => choose("hour-reset")}
        >
          Wake in the next hour
        </button>
      </div>
    </div>
  );
}

function PlayScreen() {
  const view = useGame((s) => s.view);
  const story = useGame((s) => s.story);
  const fight = useGame((s) => s.fight);
  const auto = useGame((s) => s.auto);
  const choose = useGame((s) => s.choose);

  useEffect(() => {
    if (!auto || view !== "scene" || !story) return;
    const pick = story.choices.find((c) => c.auto) ?? story.choices[0];
    if (!pick) return;
    const t = window.setTimeout(() => choose(pick.id), 2200);
    return () => window.clearTimeout(t);
  }, [auto, view, story, choose]);

  useEffect(() => {
    setPad(view === "combat" ? "kima" : view === "ending" ? "void" : "anima");
  }, [view]);

  if (view === "codex") return <CodexStage />;
  if (view === "map") return <MapStage />;
  if (view === "ending") return <EndingCard />;
  if (view === "combat" && fight) return <CombatStage fight={fight} />;
  if (story) return <SceneStage story={story} />;
  return <CodexStage />;
}

export function GameRoot() {
  const mode = useGame((s) => s.mode);
  const view = useGame((s) => s.view);
  const screen = useMemo(() => {
    if (mode === "title" && view !== "codex") return <TitleScreen />;
    if (mode === "title" && view === "codex") return <CodexStage />;
    return <PlayScreen />;
  }, [mode, view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3" || e.code === "Digit4") {
        const s = useGame.getState();
        const i = Number(e.code.slice(-1)) - 1;
        const c = s.story?.choices[i];
        if (c && s.view === "scene") s.choose(c.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return screen;
}
