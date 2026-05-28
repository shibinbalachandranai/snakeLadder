"use client";

// ─── Web Audio Engine ────────────────────────────────────────────────────────
// All sounds are synthesised in-browser — no audio files needed.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function out(): GainNode | null {
  getCtx();
  return masterGain;
}

export function setMuted(value: boolean) {
  muted = value;
  if (masterGain) masterGain.gain.value = value ? 0 : 1;
  if (!value) scheduleBgIfNeeded();
}

export function isMuted() {
  return muted;
}

// ─── Dice roll — filtered noise burst ────────────────────────────────────────
export function playDiceRoll() {
  const ac = getCtx();
  const dest = out();
  if (!ac || !dest) return;

  const dur = 0.22;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 350;
  filter.Q.value = 1.5;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.35, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start();
}

// ─── Step tick — short pluck per square ──────────────────────────────────────
export function playStep() {
  const ac = getCtx();
  const dest = out();
  if (!ac || !dest) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const t = ac.currentTime;

  osc.type = "sine";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(350, t + 0.055);

  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.06);
}

// ─── Snake hiss — descending filtered noise ───────────────────────────────────
export function playSnake() {
  const ac = getCtx();
  const dest = out();
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

  // Pitch slide down
  const pitchOsc = ac.createOscillator();
  const pitchGain = ac.createGain();
  pitchOsc.type = "sawtooth";
  pitchOsc.frequency.setValueAtTime(180, ac.currentTime);
  pitchOsc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + dur);
  pitchGain.gain.setValueAtTime(0.08, ac.currentTime);
  pitchGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  pitchOsc.connect(pitchGain);
  pitchGain.connect(dest);
  pitchOsc.start();
  pitchOsc.stop(ac.currentTime + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start();
}

// ─── Ladder chime — ascending arpeggio ───────────────────────────────────────
export function playLadder() {
  const ac = getCtx();
  const dest = out();
  if (!ac || !dest) return;

  const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4 E4 G4 C5 E5
  notes.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.1;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

// ─── Win fanfare ──────────────────────────────────────────────────────────────
export function playWin() {
  const ac = getCtx();
  const dest = out();
  if (!ac || !dest) return;

  const melody: [number, number][] = [
    [523.25, 0],    // C5
    [659.25, 0.16], // E5
    [783.99, 0.32], // G5
    [1046.5, 0.48], // C6
    [783.99, 0.7],  // G5
    [1046.5, 0.88], // C6
    [1318.5, 1.06], // E6
  ];

  melody.forEach(([freq, delay]) => {
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "square";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

// ─── Background ambient music ─────────────────────────────────────────────────
// A gentle pentatonic arpeggio that loops indefinitely.

const BG_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C4 D4 E4 G4 A4 C5
const BG_NOTE_DUR = 0.42; // seconds per note
let bgTimer: ReturnType<typeof setTimeout> | null = null;
let bgStep = 0;
let bgRunning = false;

function scheduleBgNote() {
  if (!bgRunning || muted) return;
  const ac = getCtx();
  const dest = out();
  if (!ac || !dest) return;

  const freq = BG_SCALE[bgStep % BG_SCALE.length];
  bgStep++;

  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "triangle";
  osc.frequency.value = freq;
  // Add a soft chorus via slight detune
  osc.detune.value = (bgStep % 2 === 0) ? 4 : -4;

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.045, t + 0.06);
  gain.gain.setValueAtTime(0.045, t + BG_NOTE_DUR * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.001, t + BG_NOTE_DUR * 0.95);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + BG_NOTE_DUR);

  bgTimer = setTimeout(scheduleBgNote, BG_NOTE_DUR * 1000);
}

export function startBgMusic() {
  if (bgRunning) return;
  bgRunning = true;
  scheduleBgNote();
}

export function stopBgMusic() {
  bgRunning = false;
  if (bgTimer) { clearTimeout(bgTimer); bgTimer = null; }
}

function scheduleBgIfNeeded() {
  if (bgRunning && !muted) scheduleBgNote();
}
