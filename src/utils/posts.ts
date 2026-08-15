import type { BlogEntry, PostSummary } from '../types/blog';

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

export function toPostSummary(post: BlogEntry): PostSummary {
  const tags = post.data.tags ?? [];
  return {
    slug: post.slug,
    title: post.data.title,
    excerpt: post.data.description,
    date: post.data.pubDate.toISOString().split('T')[0],
    tag: tags[0] || '文章',
    tags,
  };
}

export function getRecentPostSummaries(posts: BlogEntry[], limit: number): PostSummary[] {
  return sortPostsByDate(posts).slice(0, limit).map(toPostSummary);
}

export function getAllPostSummaries(posts: BlogEntry[]): PostSummary[] {
  return sortPostsByDate(posts).map(toPostSummary);
}

export function getUniqueTags(posts: PostSummary[]): string[] {
  return [...new Set(posts.flatMap((post) => (post.tags.length > 0 ? post.tags : [post.tag])))];
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

export function getRelatedPostSummaries(
  posts: BlogEntry[],
  current: BlogEntry,
  limit = 3,
): PostSummary[] {
  const candidates = posts.filter((post) => post.slug !== current.slug);
  const currentTags = new Set(current.data.tags ?? []);

  const scored = candidates
    .map((post) => ({
      post,
      score: (post.data.tags ?? []).filter((tag) => currentTags.has(tag)).length,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    });

  const related = scored.filter((item) => item.score > 0).slice(0, limit);
  if (related.length >= limit) {
    return related.map((item) => toPostSummary(item.post));
  }

  const used = new Set(related.map((item) => item.post.slug));
  const fallback = sortPostsByDate(candidates)
    .filter((post) => !used.has(post.slug))
    .slice(0, limit - related.length)
    .map(toPostSummary);

  return [...related.map((item) => toPostSummary(item.post)), ...fallback];
}
