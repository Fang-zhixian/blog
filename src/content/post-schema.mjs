import { z } from 'astro/zod';

const date = z.union([z.string().trim().min(1), z.date()]).pipe(z.coerce.date());
const tags = z.array(z.string().trim().min(1));

export const postFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pubDate: date,
  updatedDate: date.optional(),
  heroImage: z.string().optional(),
  ogImage: z.string().optional(),
  tags: tags.default([]),
  draft: z.boolean().default(false),
});

// Generated output must explicitly provide these fields before it can be saved.
export const generatedPostFrontmatterSchema = postFrontmatterSchema.extend({
  tags,
  draft: z.boolean(),
});
