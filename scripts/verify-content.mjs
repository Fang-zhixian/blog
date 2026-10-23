import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { markdownConfig } from '../src/config/markdown.mjs';
import { htmlToText } from '../src/utils/html-text.mjs';
import { extractFrontmatter } from './generate-post-from-raw.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
const update = args.includes('--update-baseline');
const selected = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : undefined;
const dist = args.includes('--dist') ? path.resolve(args[args.indexOf('--dist') + 1]) : path.join(root, 'dist');
if (update && !selected) throw new Error('Updating a baseline requires --slug <article-slug> after reviewing the article.');
const baselinePath = path.join(root, 'scripts/content-baselines.json');
const baselines = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
const processor = await createMarkdownProcessor({ ...markdownConfig, syntaxHighlight: false });
const contentDir = path.join(root, 'src/content/blog');
const index = JSON.parse(await fs.readFile(path.join(dist, 'search.json'), 'utf8'));
let checked = 0;
let updated = false;
for (const file of await fs.readdir(contentDir)) {
  if (!file.endsWith('.md')) continue;
  const slug = file.slice(0, -3);
  const sourcePath = path.join(contentDir, file);
  const { data, body } = extractFrontmatter(await fs.readFile(sourcePath, 'utf8'));
  if (data.draft) {
    assert(!index.some((post) => post.slug === slug), `Draft leaked into search: ${slug}`);
    continue;
  }
  const html = await fs.readFile(path.join(dist, 'blog', slug, 'index.html'), 'utf8');
  const document = new JSDOM(html).window.document;
  const article = document.querySelector('[data-post-content]');
  assert(article, `Missing article body: ${slug}`);
  const actual = htmlToText(article.innerHTML);
  const expected = htmlToText((await processor.render(body, { fileURL: pathToFileURL(sourcePath), frontmatter: data })).code);
  assert.equal(actual, expected, `Rendered body differs from Markdown: ${slug}`);
  const snapshot = { textSha256: createHash('sha256').update(actual).digest('hex'), paragraphs: article.querySelectorAll('p').length };
  if (update && selected === slug) {
    baselines.posts[slug] = snapshot;
    updated = true;
  } else if (baselines.posts[slug]) {
    assert.deepEqual(snapshot, baselines.posts[slug], `Published body or punctuation changed: ${slug}. Review the change before updating its baseline.`);
  } else {
    assert(!data.preserveText, `Verbatim article requires a reviewed baseline: ${slug}`);
  }
  const search = index.filter((post) => post.slug === slug);
  assert.equal(search.length, 1, `Missing or duplicated search entry: ${slug}`);
  assert.equal(search[0].body, actual, `Search omits visible article text: ${slug}`);
  if (!data.ogImage) {
    const image = await fs.readFile(path.join(dist, 'og', slug + '.png'));
    assert.equal(image.subarray(1, 4).toString(), 'PNG', `Invalid sharing image: ${slug}`);
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
    assert(document.querySelector('meta[property="og:image"]')?.content.endsWith(`/og/${slug}.png`), `Incorrect sharing image URL: ${slug}`);
  }
  assert(document.querySelector('[data-copy-post-link]'), `Missing sharing controls: ${slug}`);
  checked += 1;
}
if (update) {
  assert(updated, `Published article not found: ${selected}`);
  await fs.writeFile(baselinePath, JSON.stringify(baselines, null, 2) + '\n');
  console.log(`Updated reviewed content baseline: ${selected}`);
}
console.log(`Verified ${checked} published article bodies, punctuation, paragraphs, search entries and sharing controls.`);
