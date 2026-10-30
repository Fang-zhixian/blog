import type { PostSummary } from '../types/blog';
import { titlePieces } from '../utils/title-wrap';

interface Props { post: PostSummary; index: number; }
export default function PostCard({ post, index }: Props) {
  return (
    <a className="editorial-row" href={`/blog/${post.slug}`} data-content-language="zh">
      <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="row-content"><strong aria-label={post.title} data-aria-zh={post.title} data-aria-en={post.titleEn || post.title}><span data-language-show="zh" lang="zh-CN">{titlePieces(post.title, post.tags).map((piece, index) => piece.keepTogether ? <span className="title-word" key={index}>{piece.text}</span> : piece.text)}</span><span data-language-show="en" lang={post.titleEn ? 'en' : 'zh-CN'}>{post.titleEn || post.title}</span></strong><span className="row-excerpt" data-zh={post.excerpt} data-en={post.excerptEn || post.excerpt} data-content-lang-zh="zh-CN" data-content-lang-en={post.excerptEn ? 'en' : 'zh-CN'}>{post.excerpt}</span><span className="row-meta"><time dateTime={post.date}>{post.date}</time><span data-zh="中文" data-en="Chinese original">中文</span><span data-zh={`约 ${post.readingMinutes} 分钟读完`} data-en={`${post.readingMinutes} min read`}>约 {post.readingMinutes} 分钟读完</span></span></span>
    </a>
  );
}
