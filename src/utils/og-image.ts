import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createElement as h } from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { siteConfig } from '../config/site';

const require = createRequire(import.meta.url);
const fontDir = path.dirname(require.resolve('@fontsource/noto-sans-sc/package.json'));
const loadedFonts = new Map<string, Promise<Buffer>>();

async function loadFonts(text: string) {
  const css = await fs.readFile(path.join(fontDir, '400.css'), 'utf8');
  const points = [...text].map((character) => character.codePointAt(0)!);
  const selected: string[] = [];
  for (const block of css.split('@font-face')) {
    const filename = block.match(/url\(\.\/files\/([^)]*\.woff2)\)/)?.[1];
    const unicode = block.match(/unicode-range:\s*([^;]+)/)?.[1];
    if (!filename || !unicode) continue;
    const ranges = unicode.split(',').map((range) => range.trim().replace('U+', '').split('-').map((point) => parseInt(point, 16)));
    if (points.some((point) => ranges.some(([start, end = start]) => point >= start && point <= end))) selected.push(filename);
  }
  return Promise.all([...new Set(selected)].map(async (filename, index) => {
    if (!loadedFonts.has(filename)) loadedFonts.set(filename, fs.readFile(path.join(fontDir, 'files', filename)));
    return { name: `NotoSC${index}`, data: await loadedFonts.get(filename)!, weight: 400 as const, style: 'normal' as const };
  }));
}

export async function generateOgImage(title: string, category: string, date: Date): Promise<Uint8Array<ArrayBuffer>> {
  const dateText = date.toISOString().slice(0, 10);
  const hostname = new URL(siteConfig.url).hostname;
  const fonts = await loadFonts(`${title}${category}${siteConfig.author}${dateText}${hostname}`);
  const fontFamily = fonts.map((font) => font.name).join(', ');
  const svg = await satori(h('div', { style: { width: 1200, height: 630, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', backgroundColor: '#fafafa', color: '#171717', fontFamily } },
    h('div', { style: { display: 'flex', width: 1056, flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', fontSize: 26, color: '#525252' } }, h('span', null, category), h('span', null, dateText)),
    h('div', { style: { display: 'flex', width: 1056, flexShrink: 1, wordBreak: 'break-all', fontSize: [...title].length > 40 ? 52 : 64, lineHeight: 1.35, letterSpacing: '-1px', maxHeight: 340, overflow: 'hidden' } }, title),
    h('div', { style: { display: 'flex', width: 1056, flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #d4d4d4', paddingTop: 24, fontSize: 26 } }, h('span', null, siteConfig.author), h('span', { style: { color: '#525252', fontSize: 22 } }, hostname)),
  ), { width: 1200, height: 630, fonts });
  return new Uint8Array(new Resvg(svg).render().asPng());
}
