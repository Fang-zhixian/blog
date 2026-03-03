import type { BlogEntry, PostSummary } from '../types/blog';

export const POSTS_PER_PAGE = 6;

export function sortPostsByDate(posts: BlogEntry[]): BlogEntry[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function toPostSummary(post: BlogEntry): PostSummary {
  return {
    slug: post.slug,
    title: post.data.title,
    excerpt: post.data.description,
    date: post.data.pubDate.toISOString().split('T')[0],
    tag: post.data.tags?.[0] || '文章',
  };
}

export function getRecentPostSummaries(posts: BlogEntry[], limit: number): PostSummary[] {
  return sortPostsByDate(posts).slice(0, limit).map(toPostSummary);
}

export function getAllPostSummaries(posts: BlogEntry[]): PostSummary[] {
  return sortPostsByDate(posts).map(toPostSummary);
}

export function getUniqueTags(posts: PostSummary[]): string[] {
  return ['全部', ...new Set(posts.map((post) => post.tag))];
}

export function paginatePosts(posts: PostSummary[], page: number): {
  posts: PostSummary[];
  totalPages: number;
  currentPage: number;
} {
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;

  return {
    posts: posts.slice(startIndex, endIndex),
    totalPages,
    currentPage,
  };
}

export function getPaginationUrls(totalPages: number, currentPage: number): {
  prev: string | null;
  next: string | null;
} {
  return {
    prev: currentPage > 1 ? `/blog/page/${currentPage - 1}` : null,
    next: currentPage < totalPages ? `/blog/page/${currentPage + 1}` : null,
  };
}
