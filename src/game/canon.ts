import type { ContinentId, EndingId, FightDef, PathId } from "./types";

export const PALETTE = {
  void: "#05060A",
  paper: "#E8EEF6",
  anima: "#00E8D5",
  kima: "#FF2E78",
  indigo: "#2B3A67",
  bronze: "#C4A574",
  sapphire: "#3D6BAA",
  jade: "#3D8B7A",
  ember: "#E07A3D",
  gold: "#D4AF37",
  mute: "#8A93A6",
} as const;

export type Person = {
  id: string;
  name: string;
  title: string;
  image: string;
  line: string;
};

export const PEOPLE: Person[] = [
  {
    id: "azrael",
    name: "Azrael Raven",
    title: "Seeker of Echoes",
    image: "/art/azrael.jpg",
    line: "Village Seeker. Torn indigo sash. The Resonance Well in his left palm was not a gift.",
  },
  {
    id: "heartgrim",
    name: "Lord Heartgrim",
    title: "The Grimpling",
    image: "/art/heartgrim.jpg",
    line: "Harmony was an oath. The System is a lock.",
  },
  {
    id: "aeyra",
    name: "Empress Aeyra Valonyr",
    title: "Stormcrown",
    image: "/art/aeyra.jpg",
    line: "Licenses the leaving. Chivalry as weather-control.",
  },
  {
    id: "sssilvara",
    name: "Sssilvara Coil-Whisperer",
    title: "Naga Princess",
    image: "/art/sssilvara.jpg",
    line: "Heartgrim’s beloved. Azrael inherits the duty, not the love.",
  },
  {
    id: "kaisetsu",
    name: "Kaisetsu of the Thousand Palms",
    title: "Unbreakable Palm",
    image: "/art/kaisetsu.jpg",
    line: "Rebuilt Isychros. One strike. Tea as law.",
  },
  {
    id: "durak",
    name: "Durak Ironvein",
    title: "Starforge",
    image: "/art/durak.jpg",
    line: "He measured twice. The world still broke.",
  },
  {
    id: "xalthok",
    name: "Xal’thok",
    title: "The Betrayer",
    image: "/art/xalthok.jpg",
    line: "Invited advisor. Mortal hand of the Fracture.",
  },
  {
    id: "thorne",
    name: "Thorne Voidwarden",
    title: "End’s Shadow",
    image: "/art/thorne.jpg",
    line: "No throne. Grief as profession.",
  },
  {
    id: "silas",
    name: "Aeon Keeper Silas",
    title: "The Hour",
    image: "/art/silas.jpg",
    line: "Already holds both names in a loop.",
  },
  {
    id: "ryx",
    name: "Ryx Ronin",
    title: "The Seeker After",
    image: "/art/ryx.jpg",
    line: "Will crawl whatever Azrael leaves.",
  },
  {
    id: "aeltharion",
    name: "Aeltharion",
    title: "Celestial Sovereign",
    image: "/art/aeltharion.jpg",
    line: "Murdered. The sky became a warden.",
  },
];

export type Continent = {
  id: ContinentId;
  name: string;
  act: string;
  title: string;
  bg: string;
  portrait: string;
  line: string;
  x: number;
  y: number;
};

export const CONTINENTS: Continent[] = [
  {
    id: "elysara",
    name: "Elysara",
    act: "I",
    title: "The Locked Sky",
    bg: "/art/elysara-echoes.jpg",
    portrait: "/art/heartgrim.jpg",
    line: "Wind, Light, Time. The Betrayer mystery begins as fractured oaths.",
    x: 0.62,
    y: 0.34,
  },
  {
    id: "xihuang",
    name: "Xihuang",
    act: "II",
    title: "The Shed Pact",
    bg: "/art/xihuang-isychros.jpg",
    portrait: "/art/sssilvara.jpg",
    line: "Neon-bamboo and jade. A vision is not permission to replace Heartgrim.",
    x: 0.78,
    y: 0.5,
  },
  {
    id: "nordheim",
    name: "Nordheim",
    act: "III",
    title: "The Honest Anvil",
    bg: "/art/nordheim-ironhold.jpg",
    portrait: "/art/durak.jpg",
    line: "Durak forged the amulet core. Clan honor made material.",
    x: 0.48,
    y: 0.2,
  },
  {
    id: "tezcal",
    name: "Tezcal",
    act: "IV",
    title: "The Other Forge",
    bg: "/art/tezcal-krystallis.jpg",
    portrait: "/art/xalthok.jpg",
    line: "Vexaroth as craft-echo. Zorathax as theology.",
    x: 0.32,
    y: 0.58,
  },
  {
    id: "abyssara",
    name: "Abyssara",
    act: "V",
    title: "Tides",
    bg: "/art/abyssara-depthcall.jpg",
    portrait: "/art/aeyra.jpg",
    line: "The sea as a second sky. False moon-portals are Betrayer traps.",
    x: 0.2,
    y: 0.4,
  },
  {
    id: "vindraeth",
    name: "Vindraeth",
    act: "VI",
    title: "The Bottom",
    bg: "/art/vindraeth-wilds.jpg",
    portrait: "/art/thorne.jpg",
    line: "No city. The Fracture was a murder, not weather.",
    x: 0.56,
    y: 0.7,
  },
  {
    id: "caelus",
    name: "Caelus Prime",
    act: "VII",
    title: "The Hour",
    bg: "/art/caelus-hub.jpg",
    portrait: "/art/silas.jpg",
    line: "Four doors. Ryx’s name waits in a loop Azrael does not own yet.",
    x: 0.5,
    y: 0.44,
  },
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
    line: "Deceived trader. You bought a shard that was already listening.",
  },
  forged: {
    name: "Forged Will",
    cls: "VIGOR",
    kima: 70,
    anima: 28,
    line: "Wandering academic. You trained until the mortal limit cracked.",
  },
  crucible: {
    name: "Fateful Crucible",
    cls: "AEQUALIS",
    kima: 55,
    anima: 55,
    line: "Grief that still has a name. The System restricts this hardest.",
  },
};

export const ENDINGS: Record<EndingId, { name: string; need: string; body: string; bg: string }> = {
  mend: {
    name: "Mend the lattice",
    need: "Oath high. Shards united without a new tyrant.",
    body: "Dual Flow returns as a door, not a weapon. The System thins. Heartgrim can stop walking. Azrael does not take a throne — he keeps the city from needing one.",
    bg: "/art/elysara.jpg",
  },
  lock: {
    name: "The kinder cage",
    need: "Control high. Amulet used as a new lock.",
    body: "Azrael becomes the lock. Levels stay. Overflow dies. The world is safer and smaller. Aeyra approves. Heartgrim does not. Ryx will crawl a cage with a door-shaped scar.",
    bg: "/art/caelus.jpg",
  },
  walk: {
    name: "The Grimpling’s road",
    need: "Meters near even. Shards carried, not crowned.",
    body: "No mending, no new System. Azrael walks as Heartgrim walked: immortal duty, no crown, a broken circle in the palm. The lattice stays cracked. People live anyway.",
    bg: "/art/caelus-meadows.jpg",
  },
  shatter: {
    name: "Break the lock",
    need: "A meter extreme, plus smashing the amulet in Caelus.",
    body: "Oaths return. So does the old murder-math. Power grows without permission. So does betrayal. The Codex calls this ending honest, not kind.",
    bg: "/art/vindraeth-spires.jpg",
  },
};

export function pickEnding(oath: number, ctrl: number): EndingId {
  const diff = Math.abs(oath - ctrl);
  if (oath >= 62 && oath > ctrl + 10) return "mend";
  if (ctrl >= 62 && ctrl > oath + 10) return "lock";
  if (diff < 16) return "walk";
  return "shatter";
}

export const FIGHTS: Record<string, FightDef> = {
  serpent: {
    id: "serpent",
    name: "Wind Serpent Construct",
    subtitle: "Endless Azure Fields · a regulation, not a villain",
    bg: "/art/elysara-fields.jpg",
    foe: "/art/wind-serpent.jpg",
    foeName: "Wind Serpent",
    resist: "kima",
    weak: "anima",
    hp: 96,
    next: "after-serpent",
    hint: "It resists body. Thread the lattice with Anima. Dual Pulse if the wells fill.",
  },
  palm: {
    id: "palm",
    name: "Thousand Palms Trial",
    subtitle: "Isychros · Kaisetsu does not take a second blow",
    bg: "/art/xihuang-isychros.jpg",
    foe: "/art/kaisetsu.jpg",
    foeName: "Kaisetsu",
    resist: "kima",
    weak: "anima",
    hp: 88,
    next: "xihuang-after",
    hint: "Honor duel. Read the ki — Anima finds the gap in the form.",
  },
  golem: {
    id: "golem",
    name: "Starforge Sentinel",
    subtitle: "Ironhold · name the construct or it names you",
    bg: "/art/nordheim-ironhold.jpg",
    foe: "/art/nordheim.jpg",
    foeName: "Vein Golem",
    resist: "anima",
    weak: "kima",
    hp: 100,
    next: "nordheim-after",
    hint: "Anima slides off iron. Kima is the honest strike.",
  },
  smile: {
    id: "smile",
    name: "The Other Forge",
    subtitle: "Krystallis · a bargain with a receipt",
    bg: "/art/tezcal-embercrag.jpg",
    foe: "/art/xalthok.jpg",
    foeName: "Xal’thok",
    resist: "none",
    weak: "anima",
    hp: 110,
    next: "tezcal-after",
    hint: "The smile is a wound. Dual Pulse is what he taught the world to fear.",
  },
  tide: {
    id: "tide",
    name: "False Moon Portal",
    subtitle: "Depthcall · Betrayer work using a borrowed name",
    bg: "/art/abyssara-depthcall.jpg",
    foe: "/art/abyssara.jpg",
    foeName: "Moon-Rift",
    resist: "kima",
    weak: "anima",
    hp: 90,
    next: "abyssara-after",
    hint: "Tenebris is not a nineteenth god. Cut the fake moon with Anima.",
  },
};

export const ART_PRELOAD = [
  "/art/azrael.jpg",
  "/art/elysara-echoes.jpg",
  "/art/elysara-fields.jpg",
  "/art/elysara.jpg",
  "/art/elysara-cloudreach.jpg",
  "/art/heartgrim.jpg",
  "/art/aeyra.jpg",
  "/art/wind-serpent.jpg",
  "/art/world.jpg",
  "/art/xihuang.jpg",
  "/art/xihuang-isychros.jpg",
  "/art/xihuang-jadevein.jpg",
  "/art/sssilvara.jpg",
  "/art/kaisetsu.jpg",
  "/art/nordheim.jpg",
  "/art/nordheim-ironhold.jpg",
  "/art/nordheim-feralfell.jpg",
  "/art/durak.jpg",
  "/art/tezcal.jpg",
  "/art/tezcal-krystallis.jpg",
  "/art/tezcal-embercrag.jpg",
  "/art/xalthok.jpg",
  "/art/abyssara.jpg",
  "/art/abyssara-depthcall.jpg",
  "/art/abyssara-dunes.jpg",
  "/art/vindraeth.jpg",
  "/art/vindraeth-wilds.jpg",
  "/art/vindraeth-spires.jpg",
  "/art/thorne.jpg",
  "/art/caelus.jpg",
  "/art/caelus-hub.jpg",
  "/art/caelus-meadows.jpg",
  "/art/silas.jpg",
  "/art/ryx.jpg",
  "/art/aeltharion.jpg",
  "/video/poster.jpg",
];
