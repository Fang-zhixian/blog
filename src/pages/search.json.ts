import type { APIRoute } from 'astro';
import { getBlogPosts } from '../utils/content';
import { toSearchBody } from '../utils/search-body';
import { englishPostSummaries } from '../data/post-summaries-en';
import { knowledge, notes, projects } from '../data/showcase';
import { siteConfig } from '../config/site';
import aboutSource from './about.astro?raw';
import linksSource from './links/index.astro?raw';
import privacySource from './privacy.astro?raw';

function pageText(source: string, language: 'zh' | 'en') {
  const pattern = language === 'zh' ? /\bdata-zh="([^"]*)"/g : /\bdata-en="([^"]*)"/g;
  return [...source.matchAll(pattern)].map((match) => match[1]).join(' ');
}

export const GET: APIRoute = async () => {
  const posts = await getBlogPosts();

  const articles = await Promise.all(posts.map(async (post) => ({
    slug: post.slug,
    kind: 'article',
    href: `/blog/${post.slug}`,
    title: post.data.title,
    titleEn: englishPostSummaries[post.slug]?.title,
    description: post.data.description,
    descriptionEn: englishPostSummaries[post.slug]?.summary,
    tags: post.data.tags || [],
    date: post.data.pubDate.toISOString(),
    body: await toSearchBody(post.body ?? '', post.data),
  })));
  const searchIndex = [
    ...articles,
    ...projects.map((project) => ({
      slug: `project:${project.id}`, kind: 'project', href: `/projects/${project.id}/`,
      title: project.title, titleEn: project.titleEn, description: project.summary, descriptionEn: project.summaryEn,
      tags: ['作品', '项目', 'project', ...('keywords' in project ? project.keywords : [])], date: project.date,
      body: [project.problem, ...project.capabilities, ...('detailSections' in project ? project.detailSections.flatMap((section) => [section.title, ...section.paragraphs]) : []), project.limitations].join('\n'),
    })),
    ...notes.map((note) => ({
      slug: `note:${note.id}`, kind: 'note', href: `/notes/${note.id}/`,
      title: note.title, titleEn: note.titleEn, description: note.summary, descriptionEn: note.summaryEn,
      tags: ['笔记', 'note'], date: note.date, body: note.paragraphs.join('\n'),
    })),
    ...knowledge.map((entry) => ({
      slug: `knowledge:${entry.id}`, kind: 'knowledge', href: `/knowledge/${entry.id}/`,
      title: entry.title, titleEn: entry.titleEn, description: entry.summary, descriptionEn: entry.summaryEn,
      tags: ['知识库', 'knowledge', entry.topic], date: entry.date, body: [...entry.paragraphs, ...entry.points].join('\n'),
    })),
    { slug: 'page:about', kind: 'page', href: '/about/', title: '关于', titleEn: 'About', description: siteConfig.description, descriptionEn: 'About Zhixian, a developer exploring AI applications, the web, and product thinking.', tags: ['关于', 'about'], body: pageText(aboutSource, 'zh'), bodyEn: pageText(aboutSource, 'en') },
    { slug: 'page:links', kind: 'page', href: '/links/', title: '友链', titleEn: 'Links', description: '朋友们的站点与交换友链的信息。', descriptionEn: 'Friend sites and information about exchanging links.', tags: ['友链', 'links', 'friend sites'], body: `${pageText(linksSource, 'zh')} ${siteConfig.url}`, bodyEn: `${pageText(linksSource, 'en')} ${siteConfig.url}` },
    { slug: 'page:privacy', kind: 'page', href: '/privacy', title: '隐私说明', titleEn: 'Privacy', description: '本站如何处理访问、浏览与点赞数据。', descriptionEn: 'How this site handles visits, views, and likes.', tags: ['隐私', 'privacy', '统计'], body: pageText(privacySource, 'zh'), bodyEn: pageText(privacySource, 'en') },
  ];

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
