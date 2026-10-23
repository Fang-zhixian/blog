import type { APIRoute } from 'astro';
import { getBlogPosts } from '../../utils/content';
import { generateOgImage } from '../../utils/og-image';

export async function getStaticPaths() {
  return (await getBlogPosts()).map((post) => ({ params: { slug: post.slug }, props: { post } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;
  const png = await generateOgImage(post.data.title, post.data.category, post.data.pubDate);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
