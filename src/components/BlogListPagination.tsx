import PostCard from './PostCard';
import type { PostCategory, PostSummary } from '../types/blog';
import { POST_CATEGORIES } from '../content/post-schema.mjs';
import { getBlogPagePath, getCategoryPagePath, getCategoryPath, getTagPath } from '../utils/posts';

interface Props {
  posts: PostSummary[]; tags: string[]; categoryCounts: Record<PostCategory, number>;
  activeCategory?: PostCategory; activeTag?: string; currentPage: number; totalPages: number;
  heading?: string; description?: string;
}
export default function BlogListPagination({ posts, tags, categoryCounts, activeCategory, activeTag, currentPage, totalPages, heading = '博客', description = '留出篇幅，把一件事写清楚。' }: Props) {
  const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const path = activeTag ? `blog/tags/${activeTag}` : activeCategory ? `blog/${activeCategory}` : 'blog';
  const pagePath = (page: number) => activeCategory ? getCategoryPagePath(activeCategory, page) : getBlogPagePath(page);
  const categoryEnglish: Record<PostCategory, string> = { '技术实践': 'Technical practice', '产品分析': 'Product analysis', '随想': 'Reflections' };
  const headingEnglish = activeCategory ? categoryEnglish[activeCategory] : heading === '博客' ? 'Blog' : heading;
  const descriptionEnglish = activeCategory ? `${categoryCounts[activeCategory]} articles` : activeTag ? `Articles tagged “${activeTag}”` : 'Space to write things through.';
  return <>
    <header className="page-heading"><p className="path-label"><span aria-hidden="true">■</span> ~/zhixian-space/{path}</p><h1 data-zh={heading} data-en={headingEnglish}>{heading}</h1><p className="page-subtitle" data-zh={description} data-en={descriptionEnglish}>{description}</p></header>
    <div className="list-with-sidebar" data-filter-root>
      <aside className="filter-sidebar"><p data-zh="正文语言" data-en="Original language">正文语言</p><button type="button" data-content-filter="all" aria-pressed="true"><span data-zh="全部" data-en="All">全部</span><span>{posts.length}</span></button><button type="button" data-content-filter="en" aria-pressed="false">English <span>0</span></button><button type="button" data-content-filter="zh" aria-pressed="false">简体中文 <span>{posts.length}</span></button>
        <div className="sidebar-categories"><p data-zh="文章分类" data-en="Categories">文章分类</p><a href="/blog/" aria-current={!activeCategory && !activeTag ? 'page' : undefined}><span data-zh="全部" data-en="All">全部</span><span>{total}</span></a>{POST_CATEGORIES.map((category) => <a key={category} href={getCategoryPath(category)} aria-current={activeCategory === category ? 'page' : undefined}><span data-zh={category} data-en={categoryEnglish[category]}>{category}</span><span>{categoryCounts[category]}</span></a>)}</div>
        <details className="sidebar-tags"><summary data-zh="按主题浏览" data-en="Browse topics">按主题浏览</summary><div>{tags.map((tag) => <a key={tag} href={getTagPath(tag)} aria-current={activeTag === tag ? 'page' : undefined}>{tag}</a>)}</div></details>
      </aside>
      <div className="wide-list">{posts.map((post, index) => <PostCard key={post.slug} post={post} index={index} />)}{posts.length === 0 && <p className="filter-empty" data-zh="这个分类还没有文章。" data-en="No articles in this category yet.">这个分类还没有文章。</p>}<p className="filter-empty" data-filter-empty data-zh="暂时没有这个语言的内容。" data-en="No posts in this language yet." hidden>暂时没有这个语言的内容。</p>
        {!activeTag && totalPages > 1 && <nav className="editorial-pagination" aria-label="文章分页" data-aria-zh="文章分页" data-aria-en="Article pages">{currentPage > 1 ? <a href={pagePath(currentPage - 1)} data-zh="← 上一页" data-en="← Previous">← 上一页</a> : <span data-zh="上一页" data-en="Previous">上一页</span>}<span>{currentPage} / {totalPages}</span>{currentPage < totalPages ? <a href={pagePath(currentPage + 1)} data-zh="下一页 →" data-en="Next →">下一页 →</a> : <span data-zh="下一页" data-en="Next">下一页</span>}</nav>}
      </div>
    </div>
  </>;
}
