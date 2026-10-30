import type { BlogEntry, PostSummary } from '../types/blog';
import { descriptionRepeatsFirstParagraph, getTagPath } from '../utils/posts';
import { titlePieces } from '../utils/title-wrap';
import { englishPostSummaries } from '../data/post-summaries-en';

interface Props {
  post: BlogEntry; readingMinutes: number; relatedPosts: PostSummary[];
  newerPost?: PostSummary | null; olderPost?: PostSummary | null; avatar: string;
  children?: React.ReactNode;
}
export default function BlogPost({ post, readingMinutes, relatedPosts, newerPost, olderPost, avatar, children }: Props) {
  const date = new Date(post.data.pubDate).toISOString().slice(0, 10);
  const updated = post.data.updatedDate ? new Date(post.data.updatedDate).toISOString().slice(0, 10) : null;
  const english = englishPostSummaries[post.slug];
  const repeatedDescription = descriptionRepeatsFirstParagraph(post.data.description, post.body ?? '');
  return <>
    <a className="article-back" href="/blog/" data-zh="← 博客" data-en="← Blog">← 博客</a>
    <header className="article-heading">
      <p className="path-label"><span aria-hidden="true">■</span> ~/zhixian-space/blog</p>
      <h1 aria-label={post.data.title} data-aria-zh={post.data.title} data-aria-en={english?.title || post.data.title}><span data-language-show="zh" lang="zh-CN">{titlePieces(post.data.title, post.data.tags ?? []).map((piece, index) => piece.keepTogether ? <span className="title-word" key={index}>{piece.text}</span> : piece.text)}</span><span data-language-show="en" lang={english ? 'en' : 'zh-CN'}>{english?.title || post.data.title}</span></h1>
      {repeatedDescription
        ? english && <p className="article-description english-summary-only" lang="en">{english.summary}</p>
        : <p className="article-description" data-zh={post.data.description} data-en={english?.summary || post.data.description} data-content-lang-zh="zh-CN" data-content-lang-en={english ? 'en' : 'zh-CN'}>{post.data.description}</p>}
      <p className="language-note" lang="en">The full article below is in Chinese.</p>
      <div className="article-byline"><img src={avatar} alt="" /><strong>方植贤 / Zhixian</strong><time dateTime={date}>{date}</time>{updated && updated !== date && <span data-zh={`更新于 ${updated}`} data-en={`Updated ${updated}`}>更新于 {updated}</span>}<span data-zh="中文" data-en="Chinese original">中文</span><span data-zh={`约 ${readingMinutes} 分钟读完`} data-en={`${readingMinutes} min read`}>约 {readingMinutes} 分钟读完</span><span data-article-views>浏览 … 次</span></div>
      {(post.data.tags?.length ?? 0) > 0 && <div className="article-tags">{post.data.tags?.map((tag) => <a key={tag} href={getTagPath(tag)}>{tag}</a>)}</div>}
    </header>
    {post.data.heroImage && <img src={post.data.heroImage} alt="" className="article-hero-image" />}
    <article lang="zh-CN" data-post-content data-article-slug={post.slug} className="prose prose-lg dark:prose-invert article-prose">{children}</article>
    <div className="article-reaction-inline"><button type="button" data-like-article aria-pressed="false"><span aria-hidden="true">♡</span><span data-like-label>有帮助</span><span data-like-count>…</span></button><button type="button" data-back-top-inline data-zh="↑ 回到顶部" data-en="↑ Back to top">↑ 回到顶部</button><span className="metrics-status" data-metrics-status role="status" hidden></span></div>
    {(newerPost || olderPost) && <nav className="article-adjacent" aria-label="相邻文章" data-aria-zh="相邻文章" data-aria-en="Adjacent articles">{newerPost && <a href={`/blog/${newerPost.slug}`}><span data-zh="上一篇" data-en="Previous">上一篇</span><strong data-zh={newerPost.title} data-en={newerPost.titleEn || newerPost.title}>{newerPost.title}</strong></a>}{olderPost && <a href={`/blog/${olderPost.slug}`}><span data-zh="下一篇" data-en="Next">下一篇</span><strong data-zh={olderPost.title} data-en={olderPost.titleEn || olderPost.title}>{olderPost.title}</strong></a>}</nav>}
    {relatedPosts.length > 0 && <section className="article-related"><h2 data-zh="接着读" data-en="Keep reading">接着读</h2>{relatedPosts.map((related) => <a key={related.slug} className="related-link" href={`/blog/${related.slug}`}><strong data-zh={related.title} data-en={related.titleEn || related.title}>{related.title}</strong><span data-zh={related.excerpt} data-en={related.excerptEn || related.excerpt}>{related.excerpt}</span><small data-zh={`${related.date}　中文　约 ${related.readingMinutes} 分钟读完`} data-en={`${related.date}　Chinese original　${related.readingMinutes} min read`}>{related.date}　中文　约 {related.readingMinutes} 分钟读完</small></a>)}</section>}
    <div className="article-footer-links"><a href="/" data-zh="返回首页" data-en="Back home">返回首页</a><a href="/blog/" data-zh="返回列表" data-en="Back to blog">返回列表</a></div>
  </>;
}
