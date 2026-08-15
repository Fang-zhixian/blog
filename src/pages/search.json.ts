import type { APIRoute } from 'astro';
import { getBlogPosts } from '../utils/content';

export const GET: APIRoute = async () => {
  const posts = await getBlogPosts();

  const searchIndex = posts.map((post) => ({
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags || [],
    date: post.data.pubDate.toISOString(),
  }));

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
