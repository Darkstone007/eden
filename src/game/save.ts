import type { SaveBlob } from "./types";

const KEY = "aetherion.eden.v1";
const SAVE_VERSION = 1;

const defaults: SaveBlob = { version: SAVE_VERSION, loop: 1, memories: {} };

function migrate(raw: SaveBlob): SaveBlob {
  const s = { ...defaults, ...raw };
  if (!s.version || s.version < 1) s.version = 1;
  return { ...s, version: SAVE_VERSION, memories: { ...s.memories } };
}

export function loadSave(): SaveBlob {
  try {
    const raw = localStorage.getItem(KEY);
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
  } catch {
    /* ignore */
  }
}
