import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, 'raw');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');

function parseArgs(argv) {
  const args = {
    input: '',
    slug: '',
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--input' || token === '-i') {
      args.input = argv[i + 1] ?? '';
      i += 1;
    } else if (token === '--slug' || token === '-s') {
      args.slug = argv[i + 1] ?? '';
      i += 1;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--force') {
      args.force = true;
    }
  }

  return args;
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractFrontmatter(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return { data: {}, body: content };

  const data = {};
  const lines = fmMatch[1].split('\n');
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] = value;
  }

  return { data, body: content.slice(fmMatch[0].length) };
}

function buildPrompt(rawText, metadata = {}) {
  const metadataBlock = JSON.stringify(metadata, null, 2);
  return [
    '你是一位技术博客编辑，请把用户的 raw 笔记加工成可上线的中文技术博客 Markdown。',
    '',
    '硬性要求：',
    '1) 输出必须是完整 Markdown，且以 YAML frontmatter 开头与结尾（--- 包裹）。',
    '2) frontmatter 必须包含：title, description, pubDate, tags, draft。',
    '3) draft 固定为 false。',
    '4) 文章结构要清晰，默认包含：背景/问题、思路、实现细节、总结。',
    '5) 若 raw 信息不足，允许合理补全，但不要虚构不可验证的数据。',
    '6) 仅输出最终 Markdown，不要解释。',
    '',
    `建议元信息（若合理请优先使用）：${metadataBlock}`,
    '',
    '下面是 raw 笔记：',
    '---RAW START---',
    rawText,
    '---RAW END---',
  ].join('\n');
}

async function callLlm(promptText) {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL ?? 'gpt-4.1-mini';

  if (!apiKey) {
    throw new Error('Missing LLM_API_KEY. Set it in your shell or .env before running.');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You write clean production-ready markdown posts in Chinese.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('LLM returned empty content.');
  }

  return text;
}

function ensureMarkdownHasFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) {
    throw new Error('Generated markdown does not start with frontmatter.');
  }

  const endIndex = markdown.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    throw new Error('Generated markdown frontmatter is malformed.');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error('Missing --input. Example: npm run raw:generate -- --input raw/my-note.md');
  }

  const inputPath = path.isAbsolute(args.input)
    ? args.input
    : path.join(ROOT, args.input);

  const rawContent = await fs.readFile(inputPath, 'utf8');
  const { data, body } = extractFrontmatter(rawContent);

  const fallbackSlug = path.basename(inputPath, path.extname(inputPath));
  const slug = toSlug(args.slug || data.slug || data.title || fallbackSlug);
  if (!slug) {
    throw new Error('Unable to build slug. Provide --slug.');
  }

  const metadata = {
    title: data.title ?? '',
    description: data.description ?? '',
    pubDate: data.pubDate ?? new Date().toISOString().slice(0, 10),
    tags: data.tags ?? '[]',
  };

  const prompt = buildPrompt(body.trim(), metadata);
  const generatedMarkdown = await callLlm(prompt);
  ensureMarkdownHasFrontmatter(generatedMarkdown);

  const outputPath = path.join(BLOG_DIR, `${slug}.md`);
  if (!args.force) {
    try {
      await fs.access(outputPath);
      throw new Error(`Target file already exists: ${outputPath}. Use --force to overwrite.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  if (args.dryRun) {
    console.log(generatedMarkdown);
    return;
  }

  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.writeFile(outputPath, generatedMarkdown.endsWith('\n') ? generatedMarkdown : `${generatedMarkdown}\n`, 'utf8');

  console.log(`Generated post: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
