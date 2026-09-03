// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

function readBlogDates() {
  const dir = path.join(process.cwd(), 'src/content/blog');
  /** @type {Record<string, string>} */
  const dates = {};
  if (!fs.existsSync(dir)) {
    return dates;
  }

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) {
      continue;
    }

    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    if (/^draft:\s*true/m.test(raw)) {
      continue;
    }

    const slug = file.slice(0, -3);
    const updated = raw.match(/^updatedDate:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    const published = raw.match(/^pubDate:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    const value = updated?.[1] || published?.[1];
    if (value) {
      dates[slug] = value;
    }
  }

  return dates;
}

const blogDates = readBlogDates();

// https://astro.build/config
export default defineConfig({
  site: 'https://www.greedywolf.tech',
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        const match = item.url.match(/\/blog\/([^/]+)\/?$/);
        const slug = match?.[1];
        if (slug && slug !== 'tags' && slug !== 'page' && blogDates[slug]) {
          item.lastmod = new Date(blogDates[slug]);
        }
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 768, 1024, 1280],
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
    remarkRehype: {
      footnoteLabel: '参考文献',
      footnoteLabelProperties: {
        className: [],
      },
    },
  },
});
