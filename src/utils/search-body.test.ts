import { describe, expect, it } from 'vitest';
import Fuse from 'fuse.js';
import { toSearchBody } from './search-body';

describe('search text extraction', () => {
  it('preserves link labels, reference links and inline code', async () => {
    const markdown = '[关键术语](https://example.com/a_(b))、[参考资料][ref] 和 `AbortController`\n\n[ref]: https://example.com';
    expect(await toSearchBody(markdown)).toBe('关键术语、参考资料 和 AbortController');
  });

  it('keeps text after 4000 characters searchable', async () => {
    const body = await toSearchBody(`${'正文内容。'.repeat(1000)}\n\n尾部独有关键词`);
    const searcher = new Fuse([{ body }], { keys: ['body'], ignoreLocation: true, threshold: 0 });
    expect(body.length).toBeGreaterThan(4000);
    expect(searcher.search('尾部独有关键词')).toHaveLength(1);
  });

  it('indexes visible code without image URLs', async () => {
    const markdown = '# 标题\n\n第一段\n\n第二段\n\n```js\nsecretCode()\n```\n\n![截图](https://example.com/image.png)';
    expect(await toSearchBody(markdown)).toBe('标题 第一段 第二段 secretCode()');
  });

  it('includes HTML paragraphs and table text without executing scripts', async () => {
    expect(await toSearchBody('<p>所以说大道至简🤔.....?</p>\n\n<table><tr><td>表格内容</td></tr></table><script>secret()</script>', { preserveText: true })).toBe('所以说大道至简🤔.....? 表格内容');
  });

  it('preserves punctuation when requested and retains normal typography otherwise', async () => {
    const input = '"原文" .....?';
    expect(await toSearchBody(input, { preserveText: true })).toBe(input);
    expect(await toSearchBody(input)).not.toBe(input);
  });
});
