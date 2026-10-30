import { getCollection } from 'astro:content';
import { filterPublishedPosts } from './posts';
import type { BlogEntry } from '../types/blog';

// Keep the local preview aligned with the public content; draft files remain untouched.
export async function getBlogPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection('blog');
  return filterPublishedPosts(posts, false);
}
