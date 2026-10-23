import { ChevronRight } from 'lucide-react';
import type { PostSummary } from '../types/blog';
import { getCategoryPath } from '../utils/posts';

interface Props {
  post: PostSummary;
  index: number;
}

export default function PostCard({ post }: Props) {
  return (
    <article className="group">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-10 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
        <div className="md:max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <a href={getCategoryPath(post.category)} className="inline-flex min-h-8 items-center text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline">{post.category}</a>
            <time dateTime={post.date} className="text-sm text-gray-600 dark:text-gray-300">{post.date}</time>
            <span className="text-sm text-gray-600 dark:text-gray-300">约 {post.readingMinutes} 分钟</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            <a href={`/blog/${post.slug}`} className="block">
              {post.title}
            </a>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
        <div className="mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
      </div>
    </article>
  );
}
