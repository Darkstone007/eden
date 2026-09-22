type Bus = {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  muted: boolean;
  pad: OscillatorNode | null;
  padGain: GainNode | null;
};

let bus: Bus | null = null;

function make(): Bus {
  const ctx = new AudioContext({ latencyHint: "interactive" });
  const master = ctx.createGain();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  master.gain.value = 0.7;
  music.gain.value = 0.18;
  sfx.gain.value = 0.45;
  music.connect(master);
  sfx.connect(master);
  master.connect(ctx.destination);
  return { ctx, master, music, sfx, muted: false, pad: null, padGain: null };
}

export function unlockAudio() {
  if (!bus) bus = make();
  if (bus.ctx.state === "suspended") void bus.ctx.resume();
  if (!bus.pad) startPad();
}

function startPad() {
  if (!bus) return;
  const { ctx, music } = bus;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 110;
  g.gain.value = 0.0001;
  osc.connect(g);
  g.connect(music);
  osc.start();
  g.gain.setTargetAtTime(0.22, ctx.currentTime, 1.4);
  bus.pad = osc;
  bus.padGain = g;
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 18;
  lfo.connect(lfoG);
  lfoG.connect(osc.frequency);
  lfo.start();
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.18, pan = 0) {
  if (!bus || bus.muted) return;
  const { ctx, sfx } = bus;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const p = ctx.createStereoPanner();
  o.type = type;
  o.frequency.value = freq;
  p.pan.value = pan;
  g.gain.value = gain;
  g.gain.setTargetAtTime(0.0001, ctx.currentTime + dur * 0.4, dur * 0.25);
  o.connect(g);
  g.connect(p);
  p.connect(sfx);
  o.start();
  o.stop(ctx.currentTime + dur);
}

export const sfx = {
  click: () => beep(720, 0.08, "square", 0.08),
  oath: () => beep(523, 0.22, "sine", 0.16, -0.2),
  ctrl: () => beep(196, 0.22, "sawtooth", 0.1, 0.2),
  kima: () => {
    beep(180, 0.16, "sawtooth", 0.22, -0.4);
    beep(360, 0.1, "square", 0.1, -0.2);
  },
  anima: () => {
    beep(880, 0.18, "sine", 0.16, 0.35);
    beep(1320, 0.12, "triangle", 0.08, 0.5);
  },
  dual: () => {
    beep(140, 0.28, "sawtooth", 0.2, -0.3);
    beep(990, 0.28, "sine", 0.16, 0.3);
  },
  hit: () => beep(90, 0.12, "square", 0.18),
  win: () => {
    beep(523, 0.18, "sine", 0.14);
    beep(784, 0.28, "sine", 0.12);
  },
  hurt: () => beep(110, 0.2, "sawtooth", 0.16),
};

export function setMuted(muted: boolean) {
  if (!bus) return;
  bus.muted = muted;
  bus.master.gain.setTargetAtTime(muted ? 0 : 0.7, bus.ctx.currentTime, 0.04);
}

export function isMuted() {
  return bus?.muted ?? false;
}

export function setPad(kind: "anima" | "kima" | "void") {
  if (!bus?.pad) return;
  const f = kind === "kima" ? 98 : kind === "anima" ? 146 : 110;
  bus.pad.frequency.setTargetAtTime(f, bus.ctx.currentTime, 0.4);
}
