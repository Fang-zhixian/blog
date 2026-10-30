import type { BlogEntry, PostSummary, PostCategory } from '../types/blog';
import { POST_CATEGORIES } from '../content/post-schema.mjs';
import { englishPostSummaries } from '../data/post-summaries-en';

export const POSTS_PER_PAGE = 6;

export function filterPublishedPosts<T extends { data: { draft: boolean } }>(
  posts: T[],
  includeDrafts = false,
): T[] {
  return includeDrafts ? posts : posts.filter((post) => !post.data.draft);
}

export function sortPostsByDate(posts: BlogEntry[]): BlogEntry[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Hide only an exact first-paragraph duplicate; leave the article and its metadata untouched. */
export function descriptionRepeatsFirstParagraph(description: string, body: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  const firstParagraph = body.trimStart().split(/\r?\n[\t ]*\r?\n/, 1)[0] || '';
  const summary = normalize(description);
  return summary.length > 0 && summary === normalize(firstParagraph);
}

export function toPostSummary(post: BlogEntry): PostSummary {
  const tags = post.data.tags ?? [];
  return {
    slug: post.slug,
    title: post.data.title,
    excerpt: post.data.description,
    titleEn: englishPostSummaries[post.slug]?.title,
    excerptEn: englishPostSummaries[post.slug]?.summary,
    date: post.data.pubDate.toISOString().split('T')[0],
    tag: tags[0] || '文章',
    tags,
    category: post.data.category ?? '技术实践',
    readingMinutes: estimateReadingMinutes(post.body ?? ''),
  };
}

export function getRecentPostSummaries(posts: BlogEntry[], limit: number): PostSummary[] {
  return sortPostsByDate(posts).slice(0, limit).map(toPostSummary);
}

export function getAllPostSummaries(posts: BlogEntry[]): PostSummary[] {
  return sortPostsByDate(posts).map(toPostSummary);
}

export function getUniqueTags(posts: PostSummary[]): string[] {
  return [...new Set(posts.flatMap((post) => post.tags))];
}

export function getCategoryCounts(posts: PostSummary[]): Record<PostCategory, number> {
  return Object.fromEntries(POST_CATEGORIES.map((category) => [category, posts.filter((post) => post.category === category).length])) as Record<PostCategory, number>;
}

export function getCategoryPath(category: PostCategory): string {
  return `/blog/categories/${encodeURIComponent(category)}`;
}

export function getCategoryPagePath(category: PostCategory, page: number): string {
  return page <= 1 ? getCategoryPath(category) : `${getCategoryPath(category)}/${page}`;
}

export function getTagPath(tag: string): string {
  return `/blog/tags/${tag}`;
}

export function getBlogPagePath(page: number): string {
  return page <= 1 ? '/blog' : `/blog/page/${page}`;
}

export function paginatePosts(posts: PostSummary[], page: number): {
  posts: PostSummary[];
  totalPages: number;
  currentPage: number;
} {
  const totalPosts = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;

  return {
    posts: posts.slice(startIndex, endIndex),
    totalPages: totalPosts === 0 ? 0 : totalPages,
    currentPage,
  };
}

export function getPaginationUrls(totalPages: number, currentPage: number): {
  prev: string | null;
  next: string | null;
} {
  return {
    prev: currentPage > 1 ? getBlogPagePath(currentPage - 1) : null,
    next: currentPage < totalPages ? getBlogPagePath(currentPage + 1) : null,
  };
}

export function estimateReadingMinutes(text: string): number {
  const stripped = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]+/g, ' ');

  const cjkCount = (stripped.match(/[\u4e00-\u9fff]/g) || []).length;
  const wordCount = stripped
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(cjkCount / 400 + wordCount / 200));
}

export function getAdjacentPostSummaries(
  posts: BlogEntry[],
  current: BlogEntry,
): {
  newer: PostSummary | null;
  older: PostSummary | null;
} {
  const sorted = sortPostsByDate(posts);
  const index = sorted.findIndex((post) => post.slug === current.slug);
  if (index === -1) {
    return { newer: null, older: null };
  }

  return {
    newer: index > 0 ? toPostSummary(sorted[index - 1]) : null,
    older: index < sorted.length - 1 ? toPostSummary(sorted[index + 1]) : null,
  };
}

export function getRelatedPostSummaries(
  posts: BlogEntry[],
  current: BlogEntry,
  limit = 3,
  excludedSlugs: readonly string[] = [],
): PostSummary[] {
  const currentTags = new Set(current.data.tags ?? []);
  const excluded = new Set(excludedSlugs);
  if (currentTags.size === 0) {
    return [];
  }

  return posts
    .filter((post) => post.slug !== current.slug && !excluded.has(post.slug))
    .map((post) => ({
      post,
      score: (post.data.tags ?? []).filter((tag) => currentTags.has(tag)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    })
    .slice(0, limit)
    .map((item) => toPostSummary(item.post));
}
