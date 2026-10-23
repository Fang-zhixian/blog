import { defineCollection } from 'astro:content';
import { postFrontmatterSchema } from './post-schema.mjs';

const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    postFrontmatterSchema.extend({
      ogImage: image().optional(),
    }),
});

export const collections = {
  blog: blogCollection,
};
