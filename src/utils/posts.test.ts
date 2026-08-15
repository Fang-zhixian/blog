import { describe, expect, it } from 'vitest';
import type { BlogEntry, PostSummary } from '../types/blog';
import {
  estimateReadingMinutes,
  filterPublishedPosts,
  getAllPostSummaries,
  getBlogPagePath,
  getPaginationUrls,
  getRecentPostSummaries,
  getRelatedPostSummaries,
  getTagPath,
  getUniqueTags,
  paginatePosts,
} from './posts';

function makePost(
  slug: string,
  title: string,
  date: string,
  tags: string[],
  draft = false,
): BlogEntry {
  return {
    id: slug,
    slug,
    body: `${title} 的正文内容，用来测试摘要和阅读时长。`,
    collection: 'blog',
    data: {
      title,
      description: `${title} description`,
      pubDate: new Date(date),
      tags,
      draft,
    },
    render: async () => ({
      Content: () => null,
      headings: [],
      remarkPluginFrontmatter: {},
    }),
  } as unknown as BlogEntry;
}

describe('post utilities', () => {
  it('returns recent posts in descending date order', () => {
    const posts = [
      makePost('a', 'A', '2024-01-01', ['技术']),
      makePost('c', 'C', '2024-03-01', ['设计']),
      makePost('b', 'B', '2024-02-01', ['技术']),
    ];

    const recent = getRecentPostSummaries(posts, 2);
    expect(recent.map((post) => post.slug)).toEqual(['c', 'b']);
  });

  it('builds a unique tag list from all tags on a post', () => {
    const summaries: PostSummary[] = [
      { slug: 'a', title: 'A', excerpt: 'A', date: '2024-01-01', tag: '技术', tags: ['技术', 'Astro'] },
      { slug: 'b', title: 'B', excerpt: 'B', date: '2024-01-02', tag: '设计', tags: ['设计'] },
      { slug: 'c', title: 'C', excerpt: 'C', date: '2024-01-03', tag: '技术', tags: ['技术'] },
    ];

    expect(getUniqueTags(summaries)).toEqual(['技术', 'Astro', '设计']);
  });

  it('maps all posts to summaries including the full tag list', () => {
    const posts = [makePost('a', 'A', '2024-01-01', ['技术', 'Astro'])];
    const summaries = getAllPostSummaries(posts);

    expect(summaries[0]).toMatchObject({
      slug: 'a',
      title: 'A',
      tag: '技术',
      tags: ['技术', 'Astro'],
    });
  });

  it('hides drafts unless includeDrafts is true', () => {
    const posts = [
      makePost('public', 'Public', '2024-01-01', ['技术'], false),
      makePost('secret', 'Secret', '2024-01-02', ['技术'], true),
    ];

    expect(filterPublishedPosts(posts).map((post) => post.slug)).toEqual(['public']);
    expect(filterPublishedPosts(posts, true).map((post) => post.slug)).toEqual(['public', 'secret']);
  });

  it('builds pagination and tag paths', () => {
    expect(getBlogPagePath(1)).toBe('/blog');
    expect(getBlogPagePath(2)).toBe('/blog/page/2');
    expect(getTagPath('AI工作流')).toBe('/blog/tags/AI工作流');
    expect(getPaginationUrls(3, 2)).toEqual({
      prev: '/blog',
      next: '/blog/page/3',
    });
  });

  it('paginates without overflowing the last page', () => {
    const posts = Array.from({ length: 8 }, (_, index) => (
      { slug: String(index), title: 'T', excerpt: 'E', date: '2024-01-01', tag: '技术', tags: ['技术'] }
    ));
    const pageTwo = paginatePosts(posts, 2);

    expect(pageTwo.totalPages).toBe(2);
    expect(pageTwo.posts).toHaveLength(2);
    expect(paginatePosts(posts, 99).currentPage).toBe(2);
  });

  it('estimates reading time from mixed Chinese and English text', () => {
    const text = `${'字'.repeat(400)} ${'word '.repeat(200)}`;
    expect(estimateReadingMinutes(text)).toBe(2);
    expect(estimateReadingMinutes('')).toBe(1);
  });

  it('prefers overlapping tags when picking related posts', () => {
    const current = makePost('current', 'Current', '2024-04-01', ['Astro', '性能']);
    const posts = [
      current,
      makePost('astro-a', 'Astro A', '2024-03-01', ['Astro']),
      makePost('design', 'Design', '2024-02-01', ['设计']),
      makePost('perf', 'Perf', '2024-01-01', ['性能', 'Astro']),
    ];

    expect(getRelatedPostSummaries(posts, current, 2).map((post) => post.slug)).toEqual([
      'perf',
      'astro-a',
    ]);
  });
});
