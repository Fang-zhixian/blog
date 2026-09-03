import { ChevronLeft, ChevronRight } from 'lucide-react';
import PostCard from './PostCard';
import type { PostSummary } from '../types/blog';
import { getBlogPagePath, getTagPath } from '../utils/posts';

interface TagFilterProps {
  tags: string[];
  activeTag: string;
}

const TagFilter = ({ tags, activeTag }: TagFilterProps) => (
  <div className="flex flex-wrap gap-3 mb-12">
    {tags.map((tag) => {
      const href = tag === '全部' ? '/blog' : getTagPath(tag);
      const isActive = activeTag === tag;
      return (
        <a
          key={tag}
          href={href}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
            isActive
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          {tag}
        </a>
      );
    })}
  </div>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  const prevPage = currentPage > 1 ? getBlogPagePath(currentPage - 1) : null;
  const nextPage = currentPage < totalPages ? getBlogPagePath(currentPage + 1) : null;

  return (
    <div className="flex justify-center items-center gap-4 mt-16">
      {prevPage ? (
        <a
          href={prevPage}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
          上一页
        </a>
      ) : (
        <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 dark:text-gray-600">
          <ChevronLeft size={18} />
          上一页
        </span>
      )}

      <span className="text-sm text-gray-500 dark:text-gray-400">
        {currentPage} / {totalPages}
      </span>

      {nextPage ? (
        <a
          href={nextPage}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          下一页
          <ChevronRight size={18} />
        </a>
      ) : (
        <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 dark:text-gray-600">
          下一页
          <ChevronRight size={18} />
        </span>
      )}
    </div>
  );
};

interface Props {
  posts: PostSummary[];
  tags: string[];
  activeTag?: string;
  currentPage: number;
  totalPages: number;
  heading?: string;
  description?: string;
}

export default function BlogListPagination({
  posts,
  tags,
  activeTag = '全部',
  currentPage,
  totalPages,
  heading = '全部文章',
  description = '做过的项目，和还没想完的判断',
}: Props) {
  const displayTags = ['全部', ...tags];

  return (
    <>
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{heading}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">{description}</p>
      </div>

      <TagFilter tags={displayTags} activeTag={activeTag} />

      <div className="space-y-2">
        {posts.map((post, index) => (
          <PostCard key={post.slug} post={post} index={index} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>暂无文章</p>
        </div>
      )}

      {activeTag === '全部' && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </>
  );
}
