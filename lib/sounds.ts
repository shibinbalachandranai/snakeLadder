"use client";

// ─── Web Audio Engine ────────────────────────────────────────────────────────
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgGainNode: GainNode | null = null;
let muted = false;
let bgMutedState = false;

// ─── Sound Profile ────────────────────────────────────────────────────────────
export type SoundProfile = "classic" | "funny";
let soundProfile: SoundProfile = "classic";
export function setSoundProfile(p: SoundProfile) { soundProfile = p; }
export function getSoundProfile(): SoundProfile { return soundProfile; }

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    bgGainNode = ctx.createGain();
    bgGainNode.gain.value = bgMutedState ? 0 : 1;
    bgGainNode.connect(masterGain);
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function out(): GainNode | null {
  getCtx();
  return masterGain;
}

function bgOut(): GainNode | null {
  getCtx();
  return bgGainNode;
}

export function setMuted(value: boolean) {
  muted = value;
  if (masterGain) masterGain.gain.value = value ? 0 : 1;
  if (!value && !bgMutedState) scheduleBgIfNeeded();
}

export function isMuted() { return muted; }

export function setBgMuted(value: boolean) {
  bgMutedState = value;
  if (bgGainNode) bgGainNode.gain.value = value ? 0 : 1;
  if (!value && !muted) scheduleBgIfNeeded();
}

export function isBgMuted() { return bgMutedState; }

// ─── Dice Roll ────────────────────────────────────────────────────────────────

function _classicDiceRoll() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const dur = 0.22;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass"; filter.frequency.value = 350; filter.Q.value = 1.5;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.35, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  src.connect(filter); filter.connect(gain); gain.connect(dest);
  src.start();
}

function _funnyDiceRoll() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  // Three comic "tock" hits at ascending pitches
  [320, 480, 660].forEach((freq, i) => {
    const t = ac.currentTime + i * 0.07;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.055);
    g.gain.setValueAtTime(0.22 + i * 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.08);
  });
  // Short comic rattle after the tocks
  const t2 = ac.currentTime + 0.19;
  const dur = 0.14;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass"; filter.frequency.value = 520; filter.Q.value = 2;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.2, t2);
  gain.gain.exponentialRampToValueAtTime(0.001, t2 + dur);
  src.connect(filter); filter.connect(gain); gain.connect(dest);
  src.start(t2);
}

export function playDiceRoll() {
  if (soundProfile === "funny") _funnyDiceRoll(); else _classicDiceRoll();
}

// ─── Step ─────────────────────────────────────────────────────────────────────

function _classicStep() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const t = ac.currentTime;
  osc.type = "sine";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(350, t + 0.055);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
  osc.connect(gain); gain.connect(dest);
  osc.start(t); osc.stop(t + 0.06);
}

function _funnyStep() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  // Bouncy boing: frequency sweeps UP (spring-release feel)
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(580, t + 0.075);
  gain.gain.setValueAtTime(0.17, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
  osc.connect(gain); gain.connect(dest);
  osc.start(t); osc.stop(t + 0.09);
}

export function playStep() {
  if (soundProfile === "funny") _funnyStep(); else _classicStep();
}

// ─── Snake ────────────────────────────────────────────────────────────────────

function _classicSnake() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const dur = 0.85;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(3500, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(700, ac.currentTime + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.28, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  const pitchOsc = ac.createOscillator();
  const pitchGain = ac.createGain();
  pitchOsc.type = "sawtooth";
  pitchOsc.frequency.setValueAtTime(180, ac.currentTime);
  pitchOsc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + dur);
  pitchGain.gain.setValueAtTime(0.08, ac.currentTime);
  pitchGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  pitchOsc.connect(pitchGain); pitchGain.connect(dest);
  pitchOsc.start(); pitchOsc.stop(ac.currentTime + dur);
  src.connect(filter); filter.connect(gain); gain.connect(dest);
  src.start();
}

function _funnySnake() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const t = ac.currentTime;

  // === GULP (0 – 0.48s): deep descending bass swallow ===
  const gulp = ac.createOscillator();
  const gulpGain = ac.createGain();
  gulp.type = "sine";
  gulp.frequency.setValueAtTime(130, t);
  gulp.frequency.exponentialRampToValueAtTime(42, t + 0.38);
  gulpGain.gain.setValueAtTime(0.55, t);
  gulpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
  gulp.connect(gulpGain); gulpGain.connect(dest);
  gulp.start(t); gulp.stop(t + 0.52);

  // Mouth-smack click
  const smack = ac.createOscillator();
  const smackGain = ac.createGain();
  smack.type = "square"; smack.frequency.value = 220;
  smackGain.gain.setValueAtTime(0.28, t + 0.3);
  smackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.37);
  smack.connect(smackGain); smackGain.connect(dest);
  smack.start(t + 0.3); smack.stop(t + 0.4);

  // === PRRRRRR loose motion (0.55 – 2.6s) ===
  // Sawtooth carrier at low frequency modulated by an LFO at 13 Hz
  const buzz = ac.createOscillator();
  const buzzBp = ac.createBiquadFilter();
  const buzzGain = ac.createGain();
  buzz.type = "sawtooth";
  buzz.frequency.setValueAtTime(68, t + 0.55);
  buzz.frequency.linearRampToValueAtTime(46, t + 2.5);
  buzzBp.type = "bandpass"; buzzBp.frequency.value = 200; buzzBp.Q.value = 0.8;

  // LFO at 13 Hz creates the "prrrr" flutter: gain oscillates ±0.28 around 0.3
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.type = "sine"; lfo.frequency.value = 13;
  lfoGain.gain.value = 0.28;

  buzzGain.gain.setValueAtTime(0.32, t + 0.55);
  buzzGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);

  buzz.connect(buzzBp); buzzBp.connect(buzzGain); buzzGain.connect(dest);
  lfo.connect(lfoGain);
  lfoGain.connect(buzzGain.gain); // AM modulation — creates the flutter rhythm

  buzz.start(t + 0.55); lfo.start(t + 0.55);
  buzz.stop(t + 2.65); lfo.stop(t + 2.65);

  // Noise texture to enrich the prrrr body
  const noiseDur = 2.05;
  const noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * noiseDur), ac.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
  const noiseSrc = ac.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  const noiseLp = ac.createBiquadFilter();
  noiseLp.type = "lowpass"; noiseLp.frequency.value = 130;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.1, t + 0.55);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
  noiseSrc.connect(noiseLp); noiseLp.connect(noiseGain); noiseGain.connect(dest);
  noiseSrc.start(t + 0.55);
}

export function playSnake() {
  if (soundProfile === "funny") _funnySnake(); else _classicSnake();
}

// ─── Ladder ───────────────────────────────────────────────────────────────────

function _classicLadder() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
  notes.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.1;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain); gain.connect(dest);
    osc.start(t); osc.stop(t + 0.3);
  });
}

function _funnyLadder() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const t = ac.currentTime;

  // Slide whistle: sine sweep 220→1400 Hz with vibrato (wheee!)
  const whistle = ac.createOscillator();
  const whistleGain = ac.createGain();
  whistle.type = "sine";
  whistle.frequency.setValueAtTime(220, t);
  whistle.frequency.exponentialRampToValueAtTime(1400, t + 0.65);
  whistleGain.gain.setValueAtTime(0.28, t);
  whistleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.72);

  const vibrato = ac.createOscillator();
  const vibratoGain = ac.createGain();
  vibrato.type = "sine"; vibrato.frequency.value = 9;
  vibratoGain.gain.setValueAtTime(0, t);
  vibratoGain.gain.linearRampToValueAtTime(28, t + 0.38);
  vibrato.connect(vibratoGain);
  vibratoGain.connect(whistle.frequency); // FM vibrato on the whistle

  whistle.connect(whistleGain); whistleGain.connect(dest);
  whistle.start(t); vibrato.start(t);
  whistle.stop(t + 0.78); vibrato.stop(t + 0.78);

  // Quick bright arpeggio after the whistle
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    const nt = t + 0.65 + i * 0.075;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, nt);
    gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.14);
    osc.connect(gain); gain.connect(dest);
    osc.start(nt); osc.stop(nt + 0.16);
  });
}

export function playLadder() {
  if (soundProfile === "funny") _funnyLadder(); else _classicLadder();
}

// ─── Win ──────────────────────────────────────────────────────────────────────

function _classicWin() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const melody: [number, number][] = [
    [523.25, 0], [659.25, 0.16], [783.99, 0.32],
    [1046.5, 0.48], [783.99, 0.7], [1046.5, 0.88], [1318.5, 1.06],
  ];
  melody.forEach(([freq, delay]) => {
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(dest);
    osc.start(t); osc.stop(t + 0.4);
  });
}

function _funnyWin() {
  const ac = getCtx(); const dest = out();
  if (!ac || !dest) return;
  const t = ac.currentTime;

  // Party horn: sawtooth glissando 261→1046 Hz
  const horn = ac.createOscillator();
  const hornBp = ac.createBiquadFilter();
  const hornGain = ac.createGain();
  horn.type = "sawtooth";
  horn.frequency.setValueAtTime(261, t);
  horn.frequency.exponentialRampToValueAtTime(1046, t + 0.38);
  hornBp.type = "bandpass"; hornBp.frequency.value = 800; hornBp.Q.value = 0.5;
  hornGain.gain.setValueAtTime(0.22, t);
  hornGain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
  horn.connect(hornBp); hornBp.connect(hornGain); hornGain.connect(dest);
  horn.start(t); horn.stop(t + 0.48);

  // Three pop sounds
  [0.48, 0.62, 0.76].forEach((delay) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(900, t + delay);
    osc.frequency.exponentialRampToValueAtTime(200, t + delay + 0.1);
    gain.gain.setValueAtTime(0.22, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.13);
    osc.connect(gain); gain.connect(dest);
    osc.start(t + delay); osc.stop(t + delay + 0.15);
  });

  // C major chord finale
  [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + 0.88);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.93);
    gain.gain.setValueAtTime(0.13, t + 1.55);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.05);
    osc.connect(gain); gain.connect(dest);
    osc.start(t + 0.88); osc.stop(t + 2.1);
  });
}

export function playWin() {
  if (soundProfile === "funny") _funnyWin(); else _classicWin();
}

// ─── Background ambient music ─────────────────────────────────────────────────

const BG_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const BG_NOTE_DUR = 0.42;
let bgTimer: ReturnType<typeof setTimeout> | null = null;
let bgStep = 0;
let bgRunning = false;

const FUNNY_BG_SCALE = [523.25, 659.25, 783.99, 880, 1046.5, 880, 783.99, 659.25];
const FUNNY_BG_NOTE_DUR = 0.2;
let funnyBgTimer: ReturnType<typeof setTimeout> | null = null;
let funnyBgStep = 0;
let funnyBgRunning = false;

function scheduleBgNote() {
  if (!bgRunning || muted || bgMutedState) return;
  const ac = getCtx(); const dest = bgOut();
  if (!ac || !dest) return;
  const freq = BG_SCALE[bgStep % BG_SCALE.length];
  bgStep++;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle"; osc.frequency.value = freq;
  osc.detune.value = (bgStep % 2 === 0) ? 4 : -4;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.022, t + 0.06);
  gain.gain.setValueAtTime(0.022, t + BG_NOTE_DUR * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.001, t + BG_NOTE_DUR * 0.95);
  osc.connect(gain); gain.connect(dest);
  osc.start(t); osc.stop(t + BG_NOTE_DUR);
  bgTimer = setTimeout(scheduleBgNote, BG_NOTE_DUR * 1000);
}

function scheduleFunnyBgNote() {
  if (!funnyBgRunning || muted || bgMutedState) return;
  const ac = getCtx(); const dest = bgOut();
  if (!ac || !dest) return;
  const freq = FUNNY_BG_SCALE[funnyBgStep % FUNNY_BG_SCALE.length];
  funnyBgStep++;
  const t = ac.currentTime;

  // Bass layer (one octave below, square wave)
  const bass = ac.createOscillator();
  const bassGain = ac.createGain();
  bass.type = "square"; bass.frequency.value = freq * 0.5;
  bassGain.gain.setValueAtTime(0, t);
  bassGain.gain.linearRampToValueAtTime(0.012, t + 0.015);
  bassGain.gain.setValueAtTime(0.012, t + FUNNY_BG_NOTE_DUR * 0.4);
  bassGain.gain.exponentialRampToValueAtTime(0.001, t + FUNNY_BG_NOTE_DUR * 0.82);
  bass.connect(bassGain); bassGain.connect(dest);
  bass.start(t); bass.stop(t + FUNNY_BG_NOTE_DUR);

  // Melody layer (triangle)
  const mel = ac.createOscillator();
  const melGain = ac.createGain();
  mel.type = "triangle"; mel.frequency.value = freq;
  melGain.gain.setValueAtTime(0, t);
  melGain.gain.linearRampToValueAtTime(0.010, t + 0.012);
  melGain.gain.exponentialRampToValueAtTime(0.001, t + FUNNY_BG_NOTE_DUR * 0.72);
  mel.connect(melGain); melGain.connect(dest);
  mel.start(t); mel.stop(t + FUNNY_BG_NOTE_DUR);

  funnyBgTimer = setTimeout(scheduleFunnyBgNote, FUNNY_BG_NOTE_DUR * 1000);
}

export function startBgMusic() {
  if (soundProfile === "funny") {
    if (funnyBgRunning) return;
    funnyBgRunning = true;
    funnyBgStep = 0;
    scheduleFunnyBgNote();
  } else {
    if (bgRunning) return;
    bgRunning = true;
    scheduleBgNote();
  }
}

export function stopBgMusic() {
  bgRunning = false;
  funnyBgRunning = false;
  if (bgTimer) { clearTimeout(bgTimer); bgTimer = null; }
  if (funnyBgTimer) { clearTimeout(funnyBgTimer); funnyBgTimer = null; }
}

function scheduleBgIfNeeded() {
  if (bgMutedState) return;
  if (soundProfile === "funny") {
    if (funnyBgRunning && !muted) scheduleFunnyBgNote();
  } else {
    if (bgRunning && !muted) scheduleBgNote();
  }
}
