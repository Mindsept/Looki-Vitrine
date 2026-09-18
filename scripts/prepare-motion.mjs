import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const media = path.join(root, 'public/assets/technology');
const temporary = path.join(root, '.motion-frames');
const tool = path.join(root, '.media-tools/rife-metal-macos-arm64');
const binary = process.env.RIFE_BIN || path.join(tool, 'bin/rife-metal');
const model = process.env.RIFE_MODEL || path.join(tool, 'share/rife-metal/rife-v4.26.rmw');
await mkdir(temporary, { recursive: true });
await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(media, 'looki-technology.mp4'), '-vf', 'scale=1440:810', '-start_number', '0', path.join(temporary, '%03d.png')]);
for (const variant of ['desktop', 'mobile']) await mkdir(path.join(media, 'motion', variant), { recursive: true });
async function encode(input, index) {
  for (const [variant, width, quality] of [['desktop', 1440, 81], ['mobile', 900, 79]]) {
    await sharp(input).resize({ width }).webp({ quality, effort: 4 }).toFile(path.join(media, 'motion', variant, `${String(index).padStart(4, '0')}.webp`));
  }
}
const source = i => path.join(temporary, `${String(i).padStart(3, '0')}.png`);
let done = 0;
const started = Date.now();
async function pair(i) {
  const output = path.join(temporary, `pair-${i}.png`);
  await encode(source(i), i * 4);
  await run(binary, ['-0', source(i), '-1', source(i + 1), '-o', output, '-m', model, '--tier', 'hq', '--timesteps', '0.25,0.5,0.75'], { maxBuffer: 1024 * 1024 });
  for (const [step, t] of [[1, '0.25'], [2, '0.5'], [3, '0.75']]) {
    const generated = output.replace('.png', `_t${t}.png`);
    await encode(generated, i * 4 + step);
    await rm(generated);
  }
  done++;
  await writeFile(path.join(root, 'qa/interpolation-progress.txt'), `${done}/106 pairs, ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
  if (done % 10 === 0) console.log(`${done}/106 pairs`);
}
for (let i = 0; i < 106; i += 2) await Promise.all([pair(i), pair(i + 1)]);
await encode(source(106), 424);
await writeFile(path.join(media, 'motion/manifest.json'), JSON.stringify({ fps: 96, frameCount: 425, sourceFps: 24, sourceFrameCount: 107, interpolation: 'RIFE 4.26, hq, quarter timesteps', tooling: 'rife-metal v0.1.6', desktopWidth: 1440, mobileWidth: 900 }, null, 2));
await rm(temporary, { recursive: true });
console.log('425 RIFE frames ready, desktop + mobile.');
