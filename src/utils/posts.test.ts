import { describe, expect, it } from 'vitest';
import type { BlogEntry, PostSummary } from '../types/blog';
import { getAllPostSummaries, getRecentPostSummaries, getUniqueTags } from './posts';

function makePost(slug: string, title: string, date: string, tag: string): BlogEntry {
  return {
    id: slug,
    slug,
    body: '',
    collection: 'blog',
    data: {
      title,
      description: `${title} description`,
      pubDate: new Date(date),
      tags: [tag],
      draft: false,
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
      makePost('a', 'A', '2024-01-01', '技术'),
      makePost('c', 'C', '2024-03-01', '设计'),
      makePost('b', 'B', '2024-02-01', '技术'),
    ];

    const recent = getRecentPostSummaries(posts, 2);
    expect(recent.map((post) => post.slug)).toEqual(['c', 'b']);
  });

  it('builds deduplicated tag list with 全部 prefix', () => {
    const summaries: PostSummary[] = [
      { slug: 'a', title: 'A', excerpt: 'A', date: '2024-01-01', tag: '技术' },
      { slug: 'b', title: 'B', excerpt: 'B', date: '2024-01-02', tag: '设计' },
      { slug: 'c', title: 'C', excerpt: 'C', date: '2024-01-03', tag: '技术' },
    ];

    expect(getUniqueTags(summaries)).toEqual(['全部', '技术', '设计']);
  });

  it('maps all posts to summaries', () => {
    const posts = [makePost('a', 'A', '2024-01-01', '技术')];
    const summaries = getAllPostSummaries(posts);

    expect(summaries[0]).toMatchObject({
      slug: 'a',
      title: 'A',
      tag: '技术',
    });
  });
});
