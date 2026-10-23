import { describe, expect, it } from 'vitest';
import Fuse from 'fuse.js';
import { toSearchBody } from './search-body';

describe('search text extraction', () => {
  it('preserves link labels, reference links and inline code', () => {
    const markdown = '[关键术语](https://example.com/a_(b))、[参考资料][ref] 和 `AbortController`\n\n[ref]: https://example.com';
    expect(toSearchBody(markdown)).toBe('关键术语、参考资料 和 AbortController');
  });

  it('keeps text after 4000 characters searchable', () => {
    const body = toSearchBody(`${'正文内容。'.repeat(1000)}\n\n尾部独有关键词`);
    const searcher = new Fuse([{ body }], { keys: ['body'], ignoreLocation: true, threshold: 0 });
    expect(body.length).toBeGreaterThan(4000);
    expect(searcher.search('尾部独有关键词')).toHaveLength(1);
  });

  it('separates paragraphs and excludes fenced code and image URLs', () => {
    const markdown = '# 标题\n\n第一段\n\n第二段\n\n```js\nsecretCode()\n```\n\n![截图](https://example.com/image.png)';
    expect(toSearchBody(markdown)).toBe('标题 第一段 第二段');
  });
});
