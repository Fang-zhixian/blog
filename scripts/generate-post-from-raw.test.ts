// @vitest-environment node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractFrontmatter, main, parseArgs, validateGeneratedPost } from './generate-post-from-raw.mjs';

const validPost = '---\ntitle: "标题：一个例子"\ndescription: 摘要\npubDate: 2026-10-23\ntags:\n  - Astro\n  - AI\ndraft: false\n---\n\n## 正文\n\n实际内容。';

describe('generated post validation', () => {
  it('parses quoted metadata, multiline tags and Windows line endings', () => {
    const parsed = extractFrontmatter(validPost.replace(/\n/g, '\r\n'), true);
    expect(parsed.data).toMatchObject({ title: '标题：一个例子', tags: ['Astro', 'AI'] });
    expect(parsed.body).toContain('实际内容');
  });

  it('enforces draft status even when the model asks to publish', () => {
    const generated = validateGeneratedPost(validPost);
    expect(extractFrontmatter(generated).data).toMatchObject({ draft: true, tags: ['Astro', 'AI'] });
    expect(generated).toContain('实际内容');
  });

  it.each([
    ['missing required fields', '---\ntitle: Example\n---\nbody'],
    ['invalid YAML', '---\n: [invalid\n---\nbody'],
    ['invalid date', validPost.replace('2026-10-23', 'not-a-date')],
    ['invalid tags', validPost.replace('tags:\n  - Astro\n  - AI', 'tags: Astro')],
    ['missing draft field', validPost.replace('draft: false\n', '')],
    ['empty title', validPost.replace('title: "标题：一个例子"', 'title: "   "')],
    ['empty article', validPost.split('---\n\n')[0] + '---\n\n'],
    ['unfinished frontmatter', '---\ntitle: Example'],
  ])('rejects %s', (_, markdown) => {
    expect(() => validateGeneratedPost(markdown)).toThrow();
  });

  it('rejects unknown arguments and missing option values', () => {
    expect(() => parseArgs(['--input'])).toThrow('Missing value');
    expect(() => parseArgs(['--input', 'note.md', '--unknown'])).toThrow('Unknown argument');
  });
});

describe('generation workflow', () => {
  let root: string;
  const response = (content = validPost) => new Response(JSON.stringify({ choices: [{ message: { content } }] }));

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-generator-'));
    await fs.writeFile(path.join(root, 'note.md'), '---\ntitle: 原始笔记\nslug: example\ntags:\n  - Astro\n---\n\n有待整理的正文。');
  });
  afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });

  it('writes a validated draft and passes parsed metadata to the model', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response());
    const log = vi.fn();
    await main(['--input', 'note.md'], { root, env: { LLM_API_KEY: 'test', LLM_BASE_URL: 'https://example.test/v1/' }, fetchImpl, log });
    const written = await fs.readFile(path.join(root, 'src/content/blog/example.md'), 'utf8');
    expect(extractFrontmatter(written).data.draft).toBe(true);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://example.test/v1/chat/completions');
    const request = JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));
    expect(request.messages[1].content).toContain('"tags": [\n    "Astro"\n  ]');
  });

  it('rejects an existing destination before calling the API', async () => {
    const destination = path.join(root, 'src/content/blog/example.md');
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, 'original');
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(main(['--input', 'note.md'], { root, fetchImpl })).rejects.toThrow('already exists');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await fs.readFile(destination, 'utf8')).toBe('original');
  });

  it('prints a validated draft without writing it in dry-run mode', async () => {
    const log = vi.fn();
    await main(['--input', 'note.md', '--dry-run'], { root, env: { LLM_API_KEY: 'test' }, fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(response()), log });
    expect(extractFrontmatter(log.mock.calls[0][0]).data.draft).toBe(true);
    await expect(fs.access(path.join(root, 'src/content/blog'))).rejects.toThrow();
  });

  it('does not replace an existing article when forced generation is invalid', async () => {
    const destination = path.join(root, 'src/content/blog/example.md');
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, 'original');
    await expect(main(['--input', 'note.md', '--force'], { root, env: { LLM_API_KEY: 'test' }, fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(response('---\ntitle: Invalid\n---\nbody')) })).rejects.toThrow();
    expect(await fs.readFile(destination, 'utf8')).toBe('original');
  });
});
