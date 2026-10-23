import type { APIRoute } from 'astro';
import { getBlogPosts } from '../utils/content';
import { toSearchBody } from '../utils/search-body';

export const GET: APIRoute = async () => {
  const posts = await getBlogPosts();

  const searchIndex = await Promise.all(posts.map(async (post) => ({
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags || [],
    date: post.data.pubDate.toISOString(),
    body: await toSearchBody(post.body ?? '', post.data),
  })));

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
