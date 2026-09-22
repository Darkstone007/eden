import type { SaveBlob } from "./types";

const KEY = "aetherion.eden.v2";
const SAVE_VERSION = 2;

const defaults: SaveBlob = { version: SAVE_VERSION, loop: 1, memories: {}, visited: [], people: ["azrael"] };

function migrate(raw: SaveBlob): SaveBlob {
  return {
    version: SAVE_VERSION,
    loop: raw.loop ?? 1,
    memories: { ...(raw.memories ?? {}) },
    visited: Array.isArray(raw.visited) ? raw.visited : [],
    people: Array.isArray(raw.people) && raw.people.length ? raw.people : ["azrael"],
  };
}

export function loadSave(): SaveBlob {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("aetherion.eden.v1");
    if (!raw) return structuredClone(defaults);
    return migrate(JSON.parse(raw) as SaveBlob);
  } catch {
    return structuredClone(defaults);
  }
}

export function writeSave(save: SaveBlob) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...save, version: SAVE_VERSION }));
  } catch {
    /* private mode */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("aetherion.eden.v1");
  } catch {
    /* ignore */
  }
}
