import type { CollectionEntry } from 'astro:content';
import type { POST_CATEGORIES } from '../content/post-schema.mjs';

export type BlogEntry = CollectionEntry<'blog'>;
export type PostCategory = typeof POST_CATEGORIES[number];

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  tags: string[];
  category: PostCategory;
  readingMinutes: number;
}

export interface TocHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface OptimizedImage {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
}
