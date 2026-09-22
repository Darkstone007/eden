export type PathId = "lapis" | "forged" | "crucible";
export type ClassId = "UNWRITTEN" | "VIGOR" | "ARCANUS" | "AEQUALIS";
export type Mode = "title" | "play";
export type View = "scene" | "combat" | "map" | "codex" | "ending";
export type EndingId = "mend" | "lock" | "walk" | "shatter";
export type Well = "kima" | "anima" | "dual";
export type ContinentId =
  | "elysara"
  | "xihuang"
  | "nordheim"
  | "tezcal"
  | "abyssara"
  | "vindraeth"
  | "caelus";

export type SaveBlob = {
  version: number;
  loop: number;
  memories: Record<string, boolean | number | string>;
  visited: ContinentId[];
  people: string[];
};

export type StoryChoice = {
  id: string;
  tag: string;
  label: string;
  auto?: boolean;
  oath?: number;
  ctrl?: number;
  remember?: string;
  next?: string;
  combat?: string;
  map?: boolean;
  ending?: EndingId;
  person?: string;
};

export type StoryBeat = {
  id: string;
  act: string;
  place: string;
  who: string;
  sys?: boolean;
  bg: string;
  portrait?: string | null;
  text: string;
  alt?: string;
  choices: StoryChoice[];
};

export type FightDef = {
  id: string;
  name: string;
  subtitle: string;
  bg: string;
  foe: string;
  foeName: string;
  resist: "kima" | "anima" | "none";
  weak: "kima" | "anima";
  hp: number;
  next: string;
  hint: string;
};
