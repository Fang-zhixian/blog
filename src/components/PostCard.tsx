import { ChevronRight } from 'lucide-react';
import type { PostSummary } from '../types/blog';
import { getTagPath } from '../utils/posts';

interface Props {
  post: PostSummary;
  index: number;
}

export default function PostCard({ post }: Props) {
  const tags = post.tags.length > 0 ? post.tags : [post.tag];

  return (
    <article className="group">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-10 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
        <div className="md:max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {tags.map((tag) => (
              <a
                key={tag}
                href={getTagPath(tag)}
                className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {tag}
              </a>
            ))}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{post.date}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            <a href={`/blog/${post.slug}`} className="block">
              {post.title}
            </a>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
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
