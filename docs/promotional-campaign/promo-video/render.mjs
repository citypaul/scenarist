// Renders index.html frame-by-frame with headless Chromium and encodes with ffmpeg.
//
//   node render.mjs                 -> out/scenarist-promo.mp4 (needs out/soundtrack.wav, see audio.mjs)
//   node render.mjs --stills 5,17,30 -> out/still-5.png, ... for quick review
//   node render.mjs --fps 30 --workers 4
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import './timeline.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const TL = globalThis.TIMELINE;
const fps = Number(flag('fps', TL.fps));
const workers = Number(flag('workers', Math.max(2, Math.min(8, os.cpus().length - 2))));
const stills = flag('stills');
const url = pathToFileURL(path.join(here, 'index.html')).href + '?render=1';

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'] });

const openPage = async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__ready);
  return page;
};

const frameAt = async (page, t) => {
  await page.evaluate((tt) => window.renderAt(tt), t);
  return page.screenshot({ type: 'png', animations: 'disabled', caret: 'initial' });
};

if (stills) {
  const page = await openPage();
  for (const s of stills.split(',').map(Number)) {
    await writeFile(path.join(out, `still-${s}.png`), await frameAt(page, s));
    console.log(`still ${s}s`);
  }
  await browser.close();
  process.exit(0);
}

const total = Math.round(TL.duration * fps);
const per = Math.ceil(total / workers);
const segDir = path.join(out, 'segments');
await rm(segDir, { recursive: true, force: true });
await mkdir(segDir, { recursive: true });

const encodeSegment = (idx) => {
  const file = path.join(segDir, `seg-${String(idx).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-tune', 'animation', '-g', String(fps * 2), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res(file) : rej(new Error(`ffmpeg segment ${idx} exited ${c}`)))));
  return { ff, done };
};

let rendered = 0;
const started = Date.now();
const segments = await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const from = w * per, to = Math.min(total, from + per);
  const page = await openPage();
  const { ff, done } = encodeSegment(w);
  for (let f = from; f < to; f++) {
    const buf = await frameAt(page, f / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    rendered++;
    if (rendered % fps === 0) process.stdout.write(`\r${rendered}/${total} frames · ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await page.close();
  return done;
}));
await browser.close();
process.stdout.write('\n');

const list = path.join(segDir, 'list.txt');
await writeFile(list, segments.map((s) => `file '${s}'`).join('\n'));
const audio = path.join(out, 'soundtrack.wav');
const hasAudio = await access(audio).then(() => true, () => false);
const final = path.join(out, 'scenarist-promo.mp4');
const ffArgs = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
if (hasAudio) ffArgs.push('-i', audio, '-c:a', 'aac', '-b:a', '256k', '-shortest');
ffArgs.push('-c:v', 'copy', '-movflags', '+faststart', final);
await new Promise((res, rej) => spawn('ffmpeg', ffArgs, { stdio: 'inherit' }).on('close', (c) => (c === 0 ? res() : rej(new Error('concat failed')))));
console.log(`wrote ${final}${hasAudio ? '' : ' (no soundtrack found — run `node audio.mjs` first)'}`);
