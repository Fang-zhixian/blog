import fs from 'node:fs/promises';
import path from 'node:path';
import { extractFrontmatter } from './generate-post-from-raw.mjs';

const directory = path.join(process.cwd(), 'src/content/blog');
const slugs = [];
for (const file of await fs.readdir(directory)) {
  if (!file.endsWith('.md')) continue;
  const slug = file.slice(0, -3);
  const { data } = extractFrontmatter(await fs.readFile(path.join(directory, file), 'utf8'), true);
  if (data.draft) continue;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Unsupported article slug: ${slug}`);
  slugs.push(slug);
}
slugs.sort();
await fs.mkdir(path.join(process.cwd(), 'src/generated'), { recursive: true });
await fs.writeFile(path.join(process.cwd(), 'src/generated/metrics-article-slugs.mjs'), `// Generated from published posts by scripts/generate-metrics-slugs.mjs.\nexport default ${JSON.stringify(slugs, null, 2)};\n`);
console.log(`Prepared statistics for ${slugs.length} published articles.`);
