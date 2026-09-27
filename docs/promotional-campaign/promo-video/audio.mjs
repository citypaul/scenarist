// Synthesises out/soundtrack.wav from the shared timeline: a tense drone for the
// hook, a riser into the logo impact, then a 120 BPM groove with hits on every
// on-screen event. No samples, no licences — every sound is generated here.
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './timeline.js';

const TL = globalThis.TIMELINE;
const SR = 48000;
const N = Math.ceil(TL.duration * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const sendL = new Float32Array(N), sendR = new Float32Array(N);
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const idx = (t) => Math.floor(t * SR);

const add = (i, l, r, send = 0) => { if (i < 0 || i >= N) return; L[i] += l; R[i] += r; sendL[i] += l * send; sendR[i] += r * send; };

/* ---------- instruments ---------- */
function pad(t0, t1, notes, { gain = 0.05, cutoff = 900, attack = 0.8, release = 1.2, send = 0.5 } = {}) {
  const start = idx(t0), end = Math.min(N, idx(t1 + release));
  notes.forEach((m, ni) => {
    [-0.07, 0, 0.07].forEach((det, vi) => {
      const f = mtof(m + det);
      let ph = (ni * 0.37 + vi * 0.21) % 1, lp1 = 0, lp2 = 0;
      const pan = (vi - 1) * 0.5;
      for (let i = start; i < end; i++) {
        const t = (i - start) / SR, abs = i / SR;
        ph += f / SR; if (ph >= 1) ph -= 1;
        const saw = 2 * ph - 1;
        const c = cutoff * (1 + 0.25 * Math.sin(abs * 0.8));
        const a = 1 - Math.exp(-TAU * c / SR);
        lp1 += a * (saw - lp1); lp2 += a * (lp1 - lp2);
        const env = Math.min(1, t / attack) * (abs > t1 ? Math.max(0, 1 - (abs - t1) / release) : 1);
        const v = lp2 * env * gain;
        add(i, v * (1 - pan) * 0.7, v * (1 + pan) * 0.7, send);
      }
    });
  });
}
function kick(t, g = 0.9) {
  const s = idx(t);
  let ph = 0;
  for (let i = 0; i < SR * 0.45; i++) {
    const x = i / SR, f = 45 + 110 * Math.exp(-x * 28);
    ph += f / SR;
    const v = Math.sin(TAU * ph) * Math.exp(-x * 7) * g + (i < 200 ? noise() * 0.15 * (1 - i / 200) : 0);
    add(s + i, v, v);
  }
}
function hat(t, g = 0.06, dec = 45, pan = 0.2) {
  const s = idx(t); let prev = 0;
  for (let i = 0; i < SR * 0.12; i++) {
    const n = noise(), hp = n - prev; prev = n;
    const v = hp * Math.exp(-(i / SR) * dec) * g;
    add(s + i, v * (1 - pan), v * (1 + pan), 0.1);
  }
}
function clap(t, g = 0.22) {
  const s = idx(t); let lp = 0, prev = 0;
  for (let i = 0; i < SR * 0.3; i++) {
    const x = i / SR;
    const bursts = [0, 0.011, 0.022].reduce((a, o) => a + (x >= o ? Math.exp(-(x - o) * (o === 0.022 ? 18 : 120)) : 0), 0);
    const n = noise(); lp += 0.35 * (n - lp); const bp = lp - prev; prev = lp;
    const v = bp * bursts * g * 2.2;
    add(s + i, v, v, 0.35);
  }
}
function bass(t, dur, m, g = 0.28) {
  const s = idx(t), f = mtof(m); let ph = 0, lp = 0;
  for (let i = 0; i < SR * dur; i++) {
    const x = i / SR; ph += f / SR; if (ph >= 1) ph -= 1;
    const raw = Math.sin(TAU * ph) + 0.35 * (2 * ph - 1);
    lp += 0.08 * (raw - lp);
    const env = Math.min(1, x / 0.01) * Math.exp(-x * 2.2) * (x > dur - 0.05 ? (dur - x) / 0.05 : 1);
    const v = lp * env * g;
    add(s + i, v, v);
  }
}
function pluck(t, m, g = 0.08, pan = 0, dec = 5, send = 0.45) {
  const s = idx(t), f = mtof(m);
  for (let i = 0; i < SR * 1.2; i++) {
    const x = i / SR;
    const v = (Math.sin(TAU * f * x) + 0.3 * Math.sin(TAU * 2 * f * x) * Math.exp(-x * 12)) * Math.exp(-x * dec) * g * Math.min(1, x / 0.003);
    add(s + i, v * (1 - pan), v * (1 + pan), send);
  }
}
function whoosh(tCenter, dur = 0.9, g = 0.16, rising = true) {
  const s = idx(tCenter - dur * 0.7); let lp = 0, lp2 = 0;
  for (let i = 0; i < SR * dur; i++) {
    const x = i / SR / dur;
    const env = rising ? Math.pow(x, 2.2) * (x > 0.85 ? (1 - x) / 0.15 : 1) : Math.pow(1 - x, 2);
    const c = 300 + 5000 * (rising ? x : 1 - x);
    const a = 1 - Math.exp(-TAU * c / SR);
    const n = noise(); lp += a * (n - lp); lp2 += a * (lp - lp2);
    const pan = Math.sin(x * Math.PI * 2) * 0.6;
    const v = (lp - lp2 * 0.5) * env * g;
    add(s + i, v * (1 - pan), v * (1 + pan), 0.3);
  }
}
function riser(t0, t1, g = 0.14) {
  const s = idx(t0), n = idx(t1) - s; let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n; const f = 110 * Math.pow(8, x);
    ph += f / SR;
    const tone = Math.sin(TAU * ph) * 0.4 + Math.sin(TAU * ph * 1.5) * 0.2;
    const a = 1 - Math.exp(-TAU * (400 + 7000 * x * x) / SR);
    lp += a * (noise() - lp);
    const v = (tone * 0.5 + lp) * Math.pow(x, 2.5) * g;
    add(s + i, v, v, 0.4);
  }
}
function impact(t, g = 1) {
  const s = idx(t); let ph = 0, lp = 0;
  for (let i = 0; i < SR * 2.2; i++) {
    const x = i / SR, f = 38 + 90 * Math.exp(-x * 14);
    ph += f / SR;
    lp += 0.25 * (noise() - lp);
    const v = (Math.sin(TAU * ph) * Math.exp(-x * 1.8) * 0.9 + lp * Math.exp(-x * 9) * 0.6) * g;
    add(s + i, v, v, 0.5);
  }
}
function glitch(t, g = 0.3) {
  const s = idx(t); let held = 0;
  for (let i = 0; i < SR * 0.16; i++) {
    if (i % 90 === 0) held = noise();
    const x = i / SR;
    const v = (held * 0.6 + Math.sign(Math.sin(TAU * 70 * x)) * 0.4) * Math.exp(-x * 22) * g;
    add(s + i, v * 0.8, v, 0.15);
  }
}
function tick(t, g = 0.12, f = 2400) {
  const s = idx(t);
  for (let i = 0; i < SR * 0.05; i++) { const x = i / SR; const v = Math.sin(TAU * f * x) * Math.exp(-x * 120) * g; add(s + i, v, v, 0.05); }
}

/* ---------- arrangement ---------- */
const S = TL.scenes;
const beat = 60 / TL.bpm;
// Am – F – C – G, one chord per bar
const PROG = [
  { pad: [57, 60, 64, 71], root: 33 },
  { pad: [53, 57, 60, 64], root: 29 },
  { pad: [55, 60, 64, 67], root: 36 },
  { pad: [55, 59, 62, 67], root: 31 },
];
const bar = beat * 4;

// Hook: low drone, glitches on every failure, sub hit on the headline
pad(0.2, 8.2, [33, 45, 52], { gain: 0.07, cutoff: 260, attack: 2.5, release: 1.2, send: 0.3 });
const H = TL.hook;
const cmd = 'npx playwright test';
for (let i = 0; i < cmd.length; i++) tick(H.cmdStart + i * H.charStep + 0.01, 0.05, 3200 + (i % 3) * 400);
H.fails.forEach((ft) => { glitch(ft, 0.32); kick(ft, 0.35); });
glitch(H.retry, 0.18); glitch(H.retry + 0.35, 0.14);
impact(H.head1, 0.55);
pluck(H.head2, 69, 0.07, 0, 2.5);
whoosh(S.gap[0], 1.0, 0.12);

// Gap: hopeful-but-unresolved pads, soft pulse, riser into the logo
pad(8, 12, [57, 60, 64], { gain: 0.045, cutoff: 700, attack: 1.2 });
pad(12, 16, [53, 57, 60, 67], { gain: 0.045, cutoff: 1000, attack: 1.0, release: 0.3 });
for (let t = 8; t < 15.4; t += beat) kick(t, 0.25);
for (let t = 8 + beat / 2; t < 15.4; t += beat) hat(t, 0.03);
TL.gap.strikes.forEach((t) => tick(t, 0.09, 1600));
TL.gap.crosses.forEach((t) => tick(t, 0.07, 1300));
riser(13.6, TL.logo.burst, 0.2);

// Logo: impact + bright chord bloom + ascending plucks
impact(TL.logo.burst, 1.0);
pad(TL.logo.burst, S.logo[1], [48, 55, 60, 64, 67, 71], { gain: 0.05, cutoff: 1800, attack: 0.05, release: 1.5, send: 0.7 });
[72, 76, 79, 83, 84].forEach((m, i) => pluck(TL.logo.word + i * 0.09, m, 0.06, (i % 2 ? 0.4 : -0.4), 3.5, 0.7));
TL.logo.tagline.forEach((t, i) => pluck(t, [79, 83, 84, 88][i], 0.05, 0, 4, 0.7));
whoosh(S.boundary[0], 0.8, 0.13);

// Groove: 22s → 72s
const grooveStart = S.boundary[0], grooveEnd = S.cta[0];
for (let t = grooveStart, b = 0; t < grooveEnd - 0.01; t += beat, b++) {
  const inDrop = t >= S.parallel[0];
  kick(t, 0.6);
  hat(t + beat / 2, inDrop ? 0.07 : 0.05, 38);
  if (inDrop) { hat(t + beat / 4, 0.025, 70, -0.3); hat(t + 3 * beat / 4, 0.025, 70, 0.3); }
  if (t >= S.code[0] && b % 2 === 1) clap(t, inDrop ? 0.24 : 0.18);
}
for (let t = grooveStart, k = 0; t < grooveEnd - 0.01; t += bar, k++) {
  const c = PROG[k % 4];
  pad(t, t + bar, c.pad, { gain: 0.042, cutoff: t >= S.parallel[0] ? 1500 : 1000, attack: 0.3, release: 0.4 });
  for (let j = 0; j < 8; j++) bass(t + j * beat / 2, beat / 2 - 0.02, c.root + (j % 2 ? 12 : 0), 0.24);
  if (t >= S.parallel[0] - 0.01) c.pad.forEach((m, j) => { for (let r = 0; r < 2; r++) pluck(t + (j + r * 4) * beat / 2, m + 12, 0.035, j % 2 ? 0.5 : -0.5, 7, 0.5); });
}
[S.code[0], S.parallel[0], S.features[0], S.results[0]].forEach((t) => whoosh(t, 0.8, 0.12));

// Boundary: the wall landing
impact(TL.boundary.wall, 0.45);
pluck(TL.boundary.wall, 76, 0.07, 0, 3, 0.6);
// Code: autocomplete ticks, accept, test pass
[TL.code.popup, ...TL.code.popupMoves].forEach((t) => tick(t, 0.08, 1900));
pluck(TL.code.accept, 81, 0.06);
pluck(TL.code.pass, 84, 0.07); pluck(TL.code.pass + 0.08, 88, 0.06);
// Parallel: a rising chime per passing card
TL.parallel.passes.forEach((t, i) => pluck(t, [72, 74, 76, 79, 81, 84][i], 0.075, (i % 3 - 1) * 0.5, 4, 0.5));
// Features: soft hit per tile
TL.features.tiles.forEach((t, i) => { tick(t, 0.06, 1500); pluck(t, [64, 67, 71, 72, 76, 79][i], 0.045, 0, 5); });
// Results: ticks per green line, chord on the summary, stat hits
for (let i = 0; i < TL.results.lines; i++) tick(TL.results.lineStart + i * TL.results.lineStep, 0.05, 2600);
TL.results.stats.forEach((t) => kick(t, 0.3));
riser(70.6, S.cta[0], 0.14);

// CTA: final impact, resolved Cmaj9 bloom, fade out
impact(S.cta[0], 0.9);
pad(S.cta[0], 79.2, [36, 48, 55, 59, 62, 64, 67], { gain: 0.042, cutoff: 1600, attack: 0.05, release: 0.8, send: 0.8 });
[72, 76, 79, 83, 86].forEach((m, i) => pluck(TL.cta.word + i * 0.12, m, 0.05, (i % 2 ? 0.4 : -0.4), 2.5, 0.8));

/* ---------- reverb (Schroeder) on the send bus ---------- */
function reverb(inp, out, spread) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ buf: new Float32Array(d + spread), i: 0, fb: 0.82, lp: 0 }));
  const aps = [556, 441].map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
  for (let n = 0; n < N; n++) {
    const x = inp[n] * 0.35; let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i]; c.lp = o * 0.7 + c.lp * 0.3;
      c.buf[c.i] = x + c.lp * c.fb; c.i = (c.i + 1) % c.buf.length; y += o;
    }
    for (const a of aps) { const o = a.buf[a.i]; const v = -y * 0.5 + o; a.buf[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.buf.length; y = v; }
    out[n] += y * 0.5;
  }
}
reverb(sendL, L, 0); reverb(sendR, R, 23);

/* ---------- master: fades, soft clip, normalise ---------- */
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.05) * (t > 78.6 ? Math.max(0, (TL.duration - t) / 1.4) : 1);
  L[i] = Math.tanh(L[i] * 1.1) * fade; R[i] = Math.tanh(R[i] * 1.1) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');
await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'soundtrack.wav'), buf);
console.log(`wrote out/soundtrack.wav (${TL.duration}s, peak normalised from ${peak.toFixed(2)})`);
