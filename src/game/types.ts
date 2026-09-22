export type PathId = "lapis" | "forged" | "crucible";
export type ClassId = "UNWRITTEN" | "VIGOR" | "ARCANUS" | "AEQUALIS";
export type Mode = "title" | "play";
export type EndingId = "mend" | "lock" | "walk" | "shatter";
export type ContinentId =
  | "map"
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
};

export type StoryChoice = {
  tag: string;
  label: string;
  id: string;
  auto?: boolean;
};

export type StoryBeat = {
  who: string;
  text: string;
  sys?: boolean;
  portrait?: string | null;
  choices?: StoryChoice[];
};
