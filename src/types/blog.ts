import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
}
