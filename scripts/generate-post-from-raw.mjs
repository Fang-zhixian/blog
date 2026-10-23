import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { load, dump, JSON_SCHEMA } from 'js-yaml';
import { generatedPostFrontmatterSchema, postFrontmatterSchema } from '../src/content/post-schema.mjs';

export function parseArgs(argv) {
  const args = { input: '', slug: '', dryRun: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (['--input', '-i', '--slug', '-s'].includes(token)) {
      const value = argv[++i];
      if (!value || value.startsWith('-')) throw new Error(`Missing value for ${token}.`);
      args[token === '--input' || token === '-i' ? 'input' : 'slug'] = value;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--force') {
      args.force = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.input) throw new Error('Missing --input. Example: npm run raw:generate -- --input raw/my-note.md');
  return args;
}

function toSlug(value) {
  return value.trim().toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** @returns {{ data: Record<string, unknown>, body: string }} */
export function extractFrontmatter(content, required = false) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) {
    if (required || /^---[ \t]*(?:\n|$)/.test(normalized)) {
      throw new Error('Markdown must contain a complete YAML frontmatter block.');
    }
    return { data: {}, body: normalized };
  }
  const data = load(match[1], { schema: JSON_SCHEMA });
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Frontmatter must be a YAML mapping.');
  }
  return { data: /** @type {Record<string, unknown>} */ (data), body: normalized.slice(match[0].length) };
}

export function validateGeneratedPost(markdown) {
  const { data, body } = extractFrontmatter(markdown, true);
  const validated = generatedPostFrontmatterSchema.parse(data);
  if (!body.trim()) throw new Error('Generated markdown has no article body.');

  // Enforce review before publishing, even if the model returned draft: false.
  const frontmatter = dump({ ...validated, draft: true }, { lineWidth: -1, noRefs: true });
  return `---\n${frontmatter}---\n\n${body.trim()}\n`;
}

function buildPrompt(rawText, metadata) {
  return [
    '你是一位技术博客编辑，请把用户的 raw 笔记加工成中文技术博客 Markdown 草稿。',
    '',
    '硬性要求：',
    '1) 输出必须是完整 Markdown，以 --- 包裹的 YAML frontmatter 开头。',
    '2) frontmatter 必须包含：title, description, pubDate, tags, category, draft；category 从「技术实践」「产品分析」「随想」中选择。',
    '3) draft 固定为 true，审核后再由作者发布。',
    '4) 文章结构要清晰，默认包含：背景/问题、思路、实现细节、总结。',
    '5) 若 raw 信息不足，请标明待补充的信息，不要虚构事实或数据。',
    '6) 仅输出最终 Markdown，不要解释或添加外层代码围栏。',
    '',
    `建议元信息（若合理请优先使用）：${JSON.stringify(metadata, null, 2)}`,
    '',
    '下面是 raw 笔记：',
    '---RAW START---',
    rawText,
    '---RAW END---',
  ].join('\n');
}

async function callLlm(prompt, env, fetchImpl) {
  const apiKey = env.LLM_API_KEY;
  if (!apiKey) throw new Error('Missing LLM_API_KEY. Export it in your shell before running.');
  const baseUrl = (env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      model: env.LLM_MODEL ?? 'gpt-4.1-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You write clean Chinese technical blog drafts in Markdown.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`LLM request failed (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('LLM returned empty content.');
  return text.trim();
}

export async function main(argv = process.argv.slice(2), {
  root = process.cwd(),
  env = process.env,
  fetchImpl = fetch,
  log = console.log,
} = {}) {
  const args = parseArgs(argv);
  const inputPath = path.resolve(root, args.input);
  const { data, body } = extractFrontmatter(await fs.readFile(inputPath, 'utf8'));
  const metadata = postFrontmatterSchema.partial().parse(data);
  const fallbackSlug = path.basename(inputPath, path.extname(inputPath));
  if (data.slug !== undefined && typeof data.slug !== 'string') throw new Error('Raw slug must be a string.');
  const slug = toSlug(args.slug || data.slug || metadata.title || fallbackSlug);
  if (!slug) throw new Error('Unable to build slug. Provide --slug.');
  if (!body.trim()) throw new Error('Raw note has no article body.');
  const outputPath = path.join(root, 'src/content/blog', `${slug}.md`);

  // Reject existing destinations before making a paid API request.
  if (!args.dryRun && !args.force) {
    try {
      await fs.access(outputPath);
      throw new Error(`Target file already exists: ${outputPath}. Use --force to overwrite.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  const prompt = buildPrompt(body.trim(), {
    ...metadata,
    pubDate: metadata.pubDate ?? new Date().toISOString().slice(0, 10),
    tags: metadata.tags ?? [],
    draft: true,
  });
  const generated = validateGeneratedPost(await callLlm(prompt, env, fetchImpl));
  if (args.dryRun) {
    log(generated);
    return;
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, generated, { encoding: 'utf8', flag: args.force ? 'w' : 'wx' });
  log(`Generated draft: ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
