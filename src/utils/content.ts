import { getCollection } from 'astro:content';
import { filterPublishedPosts } from './posts';
import type { BlogEntry } from '../types/blog';

export async function getBlogPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection('blog');
  return filterPublishedPosts(posts, import.meta.env.DEV);
}
