import { create } from "zustand";
import { CONTINENTS, PATHS, pickEnding } from "./canon";
import { clearSave, loadSave, writeSave } from "./save";
import type { ClassId, ContinentId, EndingId, Mode, PathId, StoryBeat } from "./types";

export type HudSnap = {
  hp: number;
  max: number;
  kima: number;
  anima: number;
  continent: ContinentId;
  aimX: number;
  aimY: number;
  interact: string | null;
};

type GameState = {
  mode: Mode;
  auto: boolean;
  loop: number;
  oath: number;
  ctrl: number;
  cls: ClassId;
  path: PathId | null;
  memories: Record<string, boolean | number | string>;
  story: StoryBeat | null;
  toast: string | null;
  ending: EndingId | null;
  paused: boolean;
  hud: HudSnap;
  startPlay: (auto: boolean) => void;
  setStory: (story: StoryBeat | null) => void;
  choose: (id: string) => void;
  tickMeters: (oath: number, ctrl: number, why?: string) => void;
  remember: (key: string, value?: boolean | number | string) => void;
  persist: () => void;
  bumpLoop: () => void;
  setToast: (t: string | null) => void;
  setHud: (h: Partial<HudSnap>) => void;
  setEnding: (e: EndingId | null) => void;
  setPaused: (p: boolean) => void;
  toTitle: () => void;
  wipe: () => void;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

const saved =
  typeof window !== "undefined"
    ? loadSave()
    : { loop: 1, memories: {} as Record<string, boolean | number | string> };

export const useGame = create<GameState>((set, get) => ({
  mode: "title",
  auto: false,
  loop: saved.loop ?? 1,
  oath: 0,
  ctrl: 0,
  cls: "UNWRITTEN",
  path: null,
  memories: saved.memories ?? {},
  story: null,
  toast: null,
  ending: null,
  paused: false,
  hud: {
    hp: 100,
    max: 100,
    kima: 42,
    anima: 42,
    continent: "elysara",
    aimX: 0,
    aimY: 0,
    interact: null,
  },

  startPlay: (auto) =>
    set({
      mode: "play",
      auto,
      oath: 0,
      ctrl: 0,
      cls: "UNWRITTEN",
      path: null,
      ending: null,
      paused: true,
      toast: null,
      hud: {
        hp: 100,
        max: 100,
        kima: 42,
        anima: 42,
        continent: "elysara",
        aimX: 0,
        aimY: 0,
        interact: null,
      },
      story: {
        who: "City of Echoes · Fracture Hour",
        portrait: "/art/azrael.jpg",
        text:
          get().loop > 1
            ? "Cold stone. A shard on a cord. A visor you did not ask for. The visor already knows this stone. Somewhere in the lattice, a later name waits: Ryx."
            : "Cold stone. A shard on a cord. A visor you did not ask for. The sky over Eden is a cracked white lattice.",
        choices: [
          { tag: "Lapis", label: PATHS.lapis.line, id: "path-lapis" },
          { tag: "Forged", label: PATHS.forged.line, id: "path-forged" },
          { tag: "Crucible", label: PATHS.crucible.line, id: "path-crucible", auto: true },
        ],
      },
    }),

  setStory: (story) => set({ story, paused: !!story }),

  choose: (id) => {
    const g = get();
    if (id.startsWith("path-")) {
      const path = id.slice(5) as PathId;
      const p = PATHS[path];
      set({
        cls: p.cls,
        path,
        toast: `Class written: ${p.cls}`,
        story: {
          who: "SYSTEM",
          sys: true,
          portrait: "/art/azrael.jpg",
          text: `Class written: ${p.cls}. Resonance Well marked. Overflow possible. Sanity is a resource. Walk. Sit with Heartgrim, or file the form.`,
          choices: [
            { tag: "Oath", label: "Sit with him. Let him name the shard.", id: "heartgrim-sit", auto: true },
            { tag: "Control", label: "Walk past. File the System form.", id: "heartgrim-prompt" },
          ],
        },
      });
      return;
    }
    if (id === "heartgrim-sit" || id === "heartgrim-prompt") {
      const sit = id === "heartgrim-sit";
      const memories = { ...g.memories, metHeartgrim: true, namedTheShard: sit };
      const oath = sit ? clamp(g.oath + 18) : g.oath;
      const ctrl = sit ? g.ctrl : clamp(g.ctrl + 18);
      set({
        memories,
        oath,
        ctrl,
        toast: sit ? "Oath +18 · table kept" : "Control +18 · prompt accepted",
        story: {
          who: sit ? "Lord Heartgrim" : "SYSTEM",
          sys: !sit,
          portrait: sit ? "/art/heartgrim.jpg" : "/art/azrael.jpg",
          text: sit
            ? "Harmony was an oath. The System is a lock. You inherit the duty. Not the love. She had a name. Sssilvara. The Azure Fields still keep a regulation."
            : "Departure licensed pending Empress review. Class confirmed. Emotion flagged as noise. The Azure Fields still keep a regulation.",
          choices: [{ tag: "Engage", label: "Step into the grass.", id: "fields-go", auto: true }],
        },
      });
      writeSave({ version: 1, loop: g.loop, memories });
      return;
    }
    if (id === "fields-go") {
      set({
        story: {
          who: "Endless Azure Fields",
          portrait: "/art/elysara-fields.jpg",
          text: "Centaurs watch from the ridge and do not come down. A wind-serpent writes itself across the cracked sky. Not evil. A regulation. Kima is body. Anima is soul. Dual Pulse is what the System most hates.",
          choices: [{ tag: "Fight", label: "Open the wells.", id: "fight-start", auto: true }],
        },
      });
      return;
    }
    if (id === "fight-start") {
      set({ story: null, paused: false, toast: "Wells open" });
      window.dispatchEvent(new CustomEvent("eden-cmd", { detail: { type: "arena", id: "elysara-fields" } }));
      return;
    }
    if (id === "to-map") {
      set({
        paused: true,
        story: {
          who: "Eden",
          portrait: "/art/world.jpg",
          text: "Seven inhabited continents. Elysara, Xihuang, Nordheim, Tezcal, Abyssara, Vindraeth, Caelus Prime. Walk the world. The hour will wait.",
          choices: [{ tag: "Map", label: "Open the world.", id: "open-map", auto: true }],
        },
      });
      return;
    }
    if (id === "open-map") {
      set({ story: null, paused: false });
      window.dispatchEvent(new CustomEvent("eden-cmd", { detail: { type: "arena", id: "map" } }));
      return;
    }
    if (id.startsWith("enter-")) {
      const cid = id.slice(6) as Exclude<ContinentId, "map">;
      const c = CONTINENTS.find((x) => x.id === cid);
      if (!c) return;
      set({
        story: {
          who: `${c.name} · Act ${c.act}`,
          portrait: c.portrait,
          text: `${c.title}. ${c.line} ${c.talk}`,
          choices: [{ tag: "Enter", label: `Walk ${c.arena}.`, id: `land-${cid}`, auto: true }],
        },
      });
      return;
    }
    if (id.startsWith("land-")) {
      const cid = id.slice(5);
      set({ story: null, paused: false });
      window.dispatchEvent(new CustomEvent("eden-cmd", { detail: { type: "arena", id: cid } }));
      return;
    }
    if (id.startsWith("door-")) {
      const ending = pickEnding(g.oath, g.ctrl);
      const forced = (id.slice(5) as EndingId) || ending;
      set({ ending: forced, paused: true });
      return;
    }
    if (id === "hour-reset") {
      get().bumpLoop();
      get().startPlay(g.auto);
      window.dispatchEvent(new CustomEvent("eden-cmd", { detail: { type: "reset" } }));
    }
  },

  tickMeters: (oath, ctrl, why) => {
    set({
      oath: clamp(get().oath + oath),
      ctrl: clamp(get().ctrl + ctrl),
      toast: why ?? null,
    });
  },

  remember: (key, value = true) => {
    const memories = { ...get().memories, [key]: value };
    set({ memories });
    writeSave({ version: 1, loop: get().loop, memories });
  },

  persist: () => {
    const s = get();
    writeSave({ version: 1, loop: s.loop, memories: s.memories });
  },

  bumpLoop: () => {
    const loop = get().loop + 1;
    const memories = { ...get().memories, loopCount: loop };
    set({ loop, memories, ending: null });
    writeSave({ version: 1, loop, memories });
  },

  setToast: (toast) => set({ toast }),
  setHud: (h) => set({ hud: { ...get().hud, ...h } }),
  setEnding: (ending) => set({ ending, paused: !!ending }),
  setPaused: (paused) => set({ paused }),
  toTitle: () => set({ mode: "title", auto: false, story: null, ending: null, paused: false }),
  wipe: () => {
    clearSave();
    set({ loop: 1, memories: {}, toast: "Hour memory cleared" });
  },
}));
