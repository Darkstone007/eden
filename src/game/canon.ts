import type { ContinentId, EndingId, PathId } from "./types";

export const PALETTE = {
  void: "#05060A",
  paper: "#E8EEF6",
  anima: "#00E8D5",
  kima: "#FF2E78",
  mute: "#8A93A6",
} as const;

export type Continent = {
  id: Exclude<ContinentId, "map">;
  name: string;
  act: string;
  title: string;
  arena: string;
  bg: string;
  portrait: string;
  enemy: "serpent" | "regulator";
  resist: "kima" | "anima" | "none";
  weak: "kima" | "anima";
  line: string;
  talk: string;
};

export const CONTINENTS: Continent[] = [
  {
    id: "elysara",
    name: "Elysara",
    act: "I",
    title: "The Locked Sky",
    arena: "City of Echoes",
    bg: "/art/elysara-echoes.jpg",
    portrait: "/art/heartgrim.jpg",
    enemy: "serpent",
    resist: "kima",
    weak: "anima",
    line: "Azrael’s starting continent. Wind, Light, Time. The Betrayer mystery begins as fractured oaths.",
    talk: "Harmony was an oath. The System is a lock. That shard is a Dual Flow core I forged with Durak.",
  },
  {
    id: "xihuang",
    name: "Xihuang",
    act: "II",
    title: "The Shed Pact",
    arena: "Isychros Capital",
    bg: "/art/xihuang-isychros.jpg",
    portrait: "/art/sssilvara.jpg",
    enemy: "regulator",
    resist: "kima",
    weak: "anima",
    line: "Forge Wars scar. Sssilvara’s homeland. Neon-bamboo and jade — cyber-mystic, not a second Tokyo.",
    talk: "The pact sheds like a scale. A vision of Sssilvara is not permission to replace Heartgrim.",
  },
  {
    id: "nordheim",
    name: "Nordheim",
    act: "III",
    title: "The Honest Anvil",
    arena: "Ironhold",
    bg: "/art/nordheim-ironhold.jpg",
    portrait: "/art/durak.jpg",
    enemy: "regulator",
    resist: "anima",
    weak: "kima",
    line: "Durak forged the amulet core here. Kima crafting. Clan honor made material.",
    talk: "Durak measured twice and the world still broke. Forge a blade that remembers the first amulet.",
  },
  {
    id: "tezcal",
    name: "Tezcal",
    act: "IV",
    title: "The Other Forge",
    arena: "Krystallis",
    bg: "/art/tezcal-krystallis.jpg",
    portrait: "/art/xalthok.jpg",
    enemy: "regulator",
    resist: "anima",
    weak: "kima",
    line: "Vexaroth as the other forge. Zorathax’s suspected throne. Living artifacts outlast loyalty.",
    talk: "This is where the smile learns a second mouth: Vexaroth as craft-echo, Zorathax as theology.",
  },
  {
    id: "abyssara",
    name: "Abyssara",
    act: "V",
    title: "Tides",
    arena: "Depthcall",
    bg: "/art/abyssara-depthcall.jpg",
    portrait: "/art/aeyra.jpg",
    enemy: "regulator",
    resist: "kima",
    weak: "anima",
    line: "The sea as a second sky. False moon-portals are Betrayer traps using a borrowed name.",
    talk: "Aquavelle’s change nurtures and drowns. Mend the tides or flood a rival coast.",
  },
  {
    id: "vindraeth",
    name: "Vindraeth",
    act: "VI",
    title: "The Bottom",
    arena: "Blighted Wilds",
    bg: "/art/vindraeth-wilds.jpg",
    portrait: "/art/thorne.jpg",
    enemy: "regulator",
    resist: "none",
    weak: "anima",
    line: "No city. Thorne’s profession is grief. The Fracture was a murder, not weather.",
    talk: "Sealed after the Cataclysm’s Void Tears. High Control is offered undeath. High Oath is offered a seal.",
  },
  {
    id: "caelus",
    name: "Caelus Prime",
    act: "VII",
    title: "The Hour",
    arena: "Caelus Hub",
    bg: "/art/caelus-hub.jpg",
    portrait: "/art/silas.jpg",
    enemy: "regulator",
    resist: "none",
    weak: "anima",
    line: "Azrael’s last hour. Silas already holds both names in a loop. Four doors.",
    talk: "Ryx Ronin’s name waits in a loop Azrael does not own yet. Choose a door.",
  },
];

export const MAP_NODES: Array<{
  id: Exclude<ContinentId, "map">;
  x: number;
  y: number;
}> = [
  { id: "elysara", x: 0.62, y: 0.38 },
  { id: "xihuang", x: 0.78, y: 0.52 },
  { id: "nordheim", x: 0.48, y: 0.22 },
  { id: "tezcal", x: 0.34, y: 0.58 },
  { id: "abyssara", x: 0.22, y: 0.42 },
  { id: "vindraeth", x: 0.56, y: 0.7 },
  { id: "caelus", x: 0.5, y: 0.46 },
];

export const PATHS: Record<
  PathId,
  { name: string; cls: "VIGOR" | "ARCANUS" | "AEQUALIS"; kima: number; anima: number; line: string }
> = {
  lapis: {
    name: "Awakening Lapis",
    cls: "ARCANUS",
    kima: 28,
    anima: 70,
    line: "Deceived trader. You bought a shard that was already listening. Overflow risk.",
  },
  forged: {
    name: "Forged Will",
    cls: "VIGOR",
    kima: 70,
    anima: 28,
    line: "Wandering academic. You trained until the mortal limit cracked. Stable well.",
  },
  crucible: {
    name: "Fateful Crucible",
    cls: "AEQUALIS",
    kima: 55,
    anima: 55,
    line: "Grief that still has a name. Something in the hour ignited. The System restricts this hardest.",
  },
};

export const ENDINGS: Record<EndingId, { name: string; body: string }> = {
  mend: {
    name: "Mend the lattice",
    body: "Dual Flow returns as a door, not a weapon. The System thins. Heartgrim can stop walking.",
  },
  lock: {
    name: "The kinder cage",
    body: "Azrael becomes the lock. Levels stay. Overflow dies. The world is safer and smaller.",
  },
  walk: {
    name: "The Grimpling’s road",
    body: "No mending, no new System. Azrael walks as Heartgrim walked: immortal duty, no crown.",
  },
  shatter: {
    name: "Break the lock",
    body: "Oaths return. So does the old murder-math. The Codex calls this ending honest, not kind.",
  },
};

export function pickEnding(oath: number, ctrl: number): EndingId {
  const diff = Math.abs(oath - ctrl);
  if (oath >= 70 && oath > ctrl + 12) return "mend";
  if (ctrl >= 70 && ctrl > oath + 12) return "lock";
  if (diff < 14) return "walk";
  return "shatter";
}

export const ABILITIES = [
  { id: "kima", name: "Kima", key: "J / click", body: "Body strike. Magenta. Knocks the lattice off a regulator’s footing." },
  { id: "anima", name: "Anima", key: "K / right-click", body: "Soul bolt. Cyan. Threads a crack the System wrote." },
  { id: "dual", name: "Dual Pulse", key: "L", body: "Body and soul together. The thing the System most hates." },
  { id: "dash", name: "Step", key: "Shift", body: "A short burst through the hour. I-frames, not teleport." },
] as const;
