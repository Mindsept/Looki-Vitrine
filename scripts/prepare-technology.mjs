import { execFileSync } from 'node:child_process';
import { mkdir, readdir, rm, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const media = path.join(root, 'public/assets/technology');
const temporary = path.join(root, '.technology-frames');
await mkdir(temporary, { recursive: true });
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(media, 'looki-technology.mp4'), '-start_number', '0', path.join(temporary, '%03d.png')]);
const frames = (await readdir(temporary)).filter(name => name.endsWith('.png')).sort();
for (const [size, width, quality] of [['desktop', 1920, 80], ['mobile', 960, 78]]) {
  const directory = path.join(media, 'frames', size);
  await mkdir(directory, { recursive: true });
  for (const frame of frames) {
    await sharp(path.join(temporary, frame)).resize({ width }).webp({ quality, effort: 5 }).toFile(path.join(directory, frame.replace('.png', '.webp')));
  }
}
for (const [name, frame] of [['poster', 0], ['electronics', 31], ['optics', 60], ['phone', 83], ['cloud', 106]]) {
  for (const size of ['desktop', 'mobile']) {
    await copyFile(path.join(media, 'frames', size, `${String(frame).padStart(3, '0')}.webp`), path.join(media, `${name}-${size}.webp`));
  }
}
await writeFile(path.join(media, 'manifest.json'), JSON.stringify({ source: 'looki-technology.mp4', fps: 24, frameCount: frames.length, duration: 107 / 24, widths: { desktop: 1920, mobile: 960 } }, null, 2));
await rm(temporary, { recursive: true });
console.log(`${frames.length} frames prepared at 1920 and 960 pixels.`);
