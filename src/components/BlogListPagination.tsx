import { ChevronLeft, ChevronRight } from 'lucide-react';
import PostCard from './PostCard';
import type { PostCategory, PostSummary } from '../types/blog';
import { POST_CATEGORIES } from '../content/post-schema.mjs';
import { getBlogPagePath, getCategoryPagePath, getCategoryPath, getTagPath } from '../utils/posts';

interface Props {
  posts: PostSummary[];
  tags: string[];
  categoryCounts: Record<PostCategory, number>;
  activeCategory?: PostCategory;
  activeTag?: string;
  currentPage: number;
  totalPages: number;
  heading?: string;
  description?: string;
}

export default function BlogListPagination({
  posts, tags, categoryCounts, activeCategory, activeTag,
  currentPage, totalPages, heading = '全部文章', description = '做过、想清楚的事',
}: Props) {
  const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const categories = [{ label: '全部', count: total, href: '/blog', active: !activeCategory && !activeTag }, ...POST_CATEGORIES.map((category) => ({
    label: category, count: categoryCounts[category], href: getCategoryPath(category), active: activeCategory === category,
  }))];
  const pagePath = (page: number) => activeCategory ? getCategoryPagePath(activeCategory, page) : getBlogPagePath(page);

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{heading}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">{description}</p>
      </div>
      <nav aria-label="文章分类" className="flex flex-wrap gap-x-6 gap-y-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {categories.map((category) => (
          <a key={category.label} href={category.href} aria-current={category.active ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 border-b-2 py-3 text-sm font-medium ${category.active ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white'}`}>
            {category.label}<span className="text-xs text-gray-500 dark:text-gray-400">{category.count}</span>
          </a>
        ))}
      </nav>
      <details data-animated-disclosure className="mb-10 group" open={Boolean(activeTag)}>
        <summary className="min-h-11 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          按主题浏览 <span className="group-open:rotate-180 transition-transform" aria-hidden="true">⌄</span>
          {activeTag && <span className="font-medium text-black dark:text-white">{activeTag}</span>}
        </summary>
        <div className="flex flex-wrap gap-2 pt-3 pb-2">
          {tags.map((tag) => <a key={tag} href={getTagPath(tag)} aria-current={activeTag === tag ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center px-3 rounded-full text-sm ${activeTag === tag ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}>{tag}</a>)}
        </div>
      </details>
      <div className="space-y-8">
        {posts.map((post, index) => <PostCard key={post.slug} post={post} index={index} />)}
      </div>
      {posts.length === 0 && <p className="text-center py-20 text-gray-600 dark:text-gray-300">这个分类还没有文章。</p>}
      {!activeTag && totalPages > 1 && (
        <nav aria-label="文章分页" className="flex justify-center items-center gap-5 mt-16 text-sm">
          {currentPage > 1 ? <a href={pagePath(currentPage - 1)} className="inline-flex min-h-11 items-center gap-1"><ChevronLeft size={18} />上一页</a> : <span className="text-gray-500">上一页</span>}
          <span className="text-gray-600 dark:text-gray-300">{currentPage} / {totalPages}</span>
          {currentPage < totalPages ? <a href={pagePath(currentPage + 1)} className="inline-flex min-h-11 items-center gap-1">下一页<ChevronRight size={18} /></a> : <span className="text-gray-500">下一页</span>}
        </nav>
      )}
    </>
  );
}
