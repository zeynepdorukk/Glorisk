/**
 * Renders the brand mark into the raster formats browsers and operating systems
 * still ask for. Run with `npm run icons` after editing public/logo.svg.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const BRAND = { sky: '#0EA5E9', violet: '#7C3AED', amber: '#F59E0B', ink: '#09090B' };

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <g fill="none" stroke-width="5" stroke-linejoin="round">
    <path d="M32 5.5 58.5 32 32 58.5 5.5 32Z" stroke="${BRAND.sky}"/>
    <path d="M32 18 46 32 32 46 18 32Z" stroke="${BRAND.violet}"/>
  </g>
  <path d="M32 26.5 37.5 32 32 37.5 26.5 32Z" fill="${BRAND.amber}"/>
</svg>`;

/** Below ~32px the middle ring turns to mush, so small icons drop it. */
const compactMark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M32 4 60 32 32 60 4 32Z" fill="none" stroke="${BRAND.sky}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M32 20 44 32 32 44 20 32Z" fill="${BRAND.amber}"/>
</svg>`;

/** iOS ignores transparency, so the touch icon ships with the dark tile. */
const tileMark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${BRAND.ink}"/>
  <g transform="translate(6.4 6.4) scale(0.8)">
    <g fill="none" stroke-width="5" stroke-linejoin="round">
      <path d="M32 5.5 58.5 32 32 58.5 5.5 32Z" stroke="${BRAND.sky}"/>
      <path d="M32 18 46 32 32 46 18 32Z" stroke="${BRAND.violet}"/>
    </g>
    <path d="M32 26.5 37.5 32 32 37.5 26.5 32Z" fill="${BRAND.amber}"/>
  </g>
</svg>`;

const render = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Packs PNG frames into an ICO container. */
function packIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(16 * frames.length);
  let offset = header.length + directory.length;

  frames.forEach((frame, index) => {
    const entry = index * 16;
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, entry);
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, entry + 1);
    directory.writeUInt8(0, entry + 2);
    directory.writeUInt8(0, entry + 3);
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(frame.data.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += frame.data.length;
  });

  return Buffer.concat([header, directory, ...frames.map((frame) => frame.data)]);
}

const write = async (name, data) => {
  await fs.writeFile(path.join(PUBLIC_DIR, name), data);
  console.log(`[icons] ${name} (${(data.length / 1024).toFixed(1)} kB)`);
};

const icoFrames = await Promise.all(
  [16, 24, 32, 48, 64].map(async (size) => ({
    size,
    data: await render(size <= 32 ? compactMark : mark, size),
  })),
);
await write('favicon.ico', packIco(icoFrames));

await write('favicon-32.png', await render(compactMark, 32));
await write('icon-192.png', await render(mark, 192));
await write('icon-512.png', await render(mark, 512));
await write('apple-touch-icon.png', await render(tileMark, 180));
