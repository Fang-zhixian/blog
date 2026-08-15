import rss from '@astrojs/rss';
import { siteConfig } from '../config/site';
import { getBlogPosts } from '../utils/content';

export const GET = async () => {
  const posts = await getBlogPosts();

  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteConfig.url,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}`,
    })),
    customData: `<language>zh-cn</language>`,
  });
};
