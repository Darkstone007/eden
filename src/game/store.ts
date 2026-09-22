import { create } from "zustand";
import { CONTINENT_BEAT, BEATS } from "./story";
import { CONTINENTS, PATHS, pickEnding } from "./canon";
import { sfx } from "./audio";
import { clearSave, loadSave, writeSave } from "./save";
import type {
  ClassId,
  ContinentId,
  EndingId,
  FightDef,
  Mode,
  PathId,
  StoryBeat,
  View,
} from "./types";
import { FIGHTS } from "./canon";

const saved =
  typeof window !== "undefined"
    ? loadSave()
    : { loop: 1, memories: {}, visited: [] as ContinentId[], people: ["azrael"] };

type GameState = {
  mode: Mode;
  view: View;
  auto: boolean;
  loop: number;
  oath: number;
  ctrl: number;
  cls: ClassId;
  path: PathId | null;
  memories: Record<string, boolean | number | string>;
  visited: ContinentId[];
  people: string[];
  beatId: string;
  story: StoryBeat | null;
  fight: FightDef | null;
  toast: string | null;
  ending: EndingId | null;
  muted: boolean;
  startPlay: (auto: boolean) => void;
  choose: (id: string) => void;
  enterContinent: (id: ContinentId) => void;
  finishCombat: (won: boolean) => void;
  openCodex: () => void;
  openMap: () => void;
  closeOverlay: () => void;
  toTitle: () => void;
  wipe: () => void;
  toggleMute: () => void;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function persist(g: Pick<GameState, "loop" | "memories" | "visited" | "people">) {
  writeSave({ version: 2, loop: g.loop, memories: g.memories, visited: g.visited, people: g.people });
}

function withBeat(beat: StoryBeat, loop: number): StoryBeat {
  return { ...beat, text: loop > 1 && beat.alt ? beat.alt : beat.text };
}

export const useGame = create<GameState>((set, get) => ({
  mode: "title",
  view: "scene",
  auto: false,
  loop: saved.loop ?? 1,
  oath: 0,
  ctrl: 0,
  cls: "UNWRITTEN",
  path: null,
  memories: saved.memories ?? {},
  visited: saved.visited ?? [],
  people: saved.people?.length ? saved.people : ["azrael"],
  beatId: "wake",
  story: null,
  fight: null,
  toast: null,
  ending: null,
  muted: false,

  startPlay: (auto) => {
    const loop = get().loop;
    const wake = withBeat(BEATS.wake, loop);
    set({
      mode: "play",
      view: "scene",
      auto,
      oath: 0,
      ctrl: 0,
      cls: "UNWRITTEN",
      path: null,
      ending: null,
      fight: null,
      toast: null,
      people: get().people.length ? get().people : ["azrael"],
      beatId: "wake",
      story: wake,
      visited: get().visited.includes("elysara") ? get().visited : [...get().visited, "elysara"],
    });
  },

  choose: (id) => {
    const g = get();
    if (id.startsWith("path-")) {
      const path = id.slice(5) as PathId;
      const p = PATHS[path];
      sfx.oath();
      set({
        cls: p.cls,
        path,
        toast: `Class written: ${p.cls}`,
        beatId: "classed",
        story: {
          ...withBeat(BEATS.classed, g.loop),
          text: `Class written: ${p.cls}. ${p.line} Resonance Well marked. Overflow possible. Sanity is a resource. Walk. Sit with Heartgrim, or file the form.`,
        },
      });
      return;
    }

    const choice = g.story?.choices.find((c) => c.id === id);
    if (!choice) {
      if (id === "hour-reset") {
        const loop = g.loop + 1;
        const memories = { ...g.memories, loopCount: loop };
        writeSave({ version: 2, loop, memories, visited: g.visited, people: g.people });
        set({ loop, memories, ending: null, view: "scene" });
        get().startPlay(g.auto);
        return;
      }
      return;
    }

    const memories = { ...g.memories };
    if (choice.remember) memories[choice.remember] = true;
    const people = choice.person && !g.people.includes(choice.person) ? [...g.people, choice.person] : g.people;
    const oath = clamp(g.oath + (choice.oath ?? 0));
    const ctrl = clamp(g.ctrl + (choice.ctrl ?? 0));
    if (choice.oath) sfx.oath();
    else if (choice.ctrl) sfx.ctrl();
    else sfx.click();

    let toast = g.toast;
    if (choice.oath) toast = `Oath +${choice.oath}`;
    if (choice.ctrl) toast = `Control +${choice.ctrl}`;

    if (choice.ending) {
      const forced = choice.ending;
      persist({ loop: g.loop, memories, visited: g.visited, people });
      set({ memories, people, oath, ctrl, toast, ending: forced, view: "ending", story: g.story });
      return;
    }

    if (choice.combat) {
      const fight = FIGHTS[choice.combat];
      persist({ loop: g.loop, memories, visited: g.visited, people });
      set({ memories, people, oath, ctrl, toast, fight, view: "combat", story: g.story });
      return;
    }

    if (choice.map) {
      persist({ loop: g.loop, memories, visited: g.visited, people });
      set({ memories, people, oath, ctrl, toast, view: "map", story: g.story });
      return;
    }

    if (choice.next && BEATS[choice.next]) {
      persist({ loop: g.loop, memories, visited: g.visited, people });
      set({
        memories,
        people,
        oath,
        ctrl,
        toast,
        beatId: choice.next,
        story: withBeat(BEATS[choice.next], g.loop),
        view: "scene",
      });
    }
  },

  enterContinent: (id) => {
    const g = get();
    if (id === "caelus") {
      const others = g.visited.filter((v) => v !== "elysara" && v !== "caelus");
      if (others.length < 2 && !g.auto) {
        set({ toast: "The Hour waits until two continents have been walked." });
        return;
      }
    }
    const beatId = CONTINENT_BEAT[id];
    const beat = BEATS[beatId];
    if (!beat) return;
    const visited = g.visited.includes(id) ? g.visited : [...g.visited, id];
    const c = CONTINENTS.find((x) => x.id === id);
    persist({ loop: g.loop, memories: g.memories, visited, people: g.people });
    sfx.click();
    set({
      visited,
      beatId,
      story: withBeat(beat, g.loop),
      view: "scene",
      toast: c ? `Act ${c.act} · ${c.name}` : null,
    });
  },

  finishCombat: (won) => {
    const g = get();
    const fight = g.fight;
    if (!fight) {
      set({ view: "scene" });
      return;
    }
    if (won) {
      sfx.win();
      const memories = { ...g.memories, [`cleared:${fight.id}`]: true };
      const next = BEATS[fight.next];
      persist({ loop: g.loop, memories, visited: g.visited, people: g.people });
      set({
        memories,
        fight: null,
        view: "scene",
        beatId: fight.next,
        story: next ? withBeat(next, g.loop) : g.story,
        toast: `${fight.foeName} held`,
        oath: clamp(g.oath + 8),
        ctrl: clamp(g.ctrl + 2),
      });
    } else {
      sfx.hurt();
      set({
        toast: "The hour caught you. Wells reopen.",
        ctrl: clamp(g.ctrl + 4),
      });
    }
  },

  openCodex: () => set({ view: "codex" }),
  openMap: () => {
    if (get().mode === "title") get().startPlay(false);
    set({ view: "map" });
  },
  closeOverlay: () => {
    const g = get();
    if (g.ending) set({ view: "ending" });
    else if (g.fight) set({ view: "combat" });
    else set({ view: "scene" });
  },
  toTitle: () => set({ mode: "title", auto: false, view: "scene", story: null, fight: null, ending: null }),
  wipe: () => {
    clearSave();
    set({ loop: 1, memories: {}, visited: [], people: ["azrael"], toast: "Hour memory cleared" });
  },
  toggleMute: () => set({ muted: !get().muted }),
}));

export function suggestedDoor(oath: number, ctrl: number): EndingId {
  return pickEnding(oath, ctrl);
}
