import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Calendar } from 'lucide-react';
import type { BlogEntry, PostSummary } from '../types/blog';
import { getTagPath } from '../utils/posts';

interface Props {
  post: BlogEntry;
  readingMinutes: number;
  relatedPosts: PostSummary[];
  children?: React.ReactNode;
}

export default function BlogPost({ post, readingMinutes, relatedPosts, children }: Props) {
  const formattedDate = new Date(post.data.pubDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const tags = post.data.tags ?? [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <a
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回文章列表</span>
        </a>
      </motion.div>

      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-12"
      >
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {tags.map((tag) => (
              <a
                key={tag}
                href={getTagPath(tag)}
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {tag}
              </a>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] mb-6">
          {post.data.title}
        </h1>

        <div className="flex items-center gap-6 text-gray-400 dark:text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>阅读约 {readingMinutes} 分钟</span>
          </div>
        </div>
      </motion.header>

      {post.data.heroImage && (
        <img
          src={post.data.heroImage}
          alt=""
          className="w-full rounded-xl mb-12"
        />
      )}

      <hr className="border-gray-200 dark:border-gray-800 mb-12" />

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="prose prose-lg prose-gray dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-28
          prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
          prose-p:leading-relaxed
          prose-a:text-black dark:prose-a:text-white prose-a:no-underline prose-a:border-b prose-a:border-black dark:prose-a:border-white prose-a:hover:text-gray-600 dark:prose-a:hover:text-gray-300
          prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800
          prose-blockquote:border-l-4 prose-blockquote:border-black dark:prose-blockquote:border-white prose-blockquote:pl-6 prose-blockquote:italic
          prose-img:rounded-xl
          prose-li:marker:text-gray-400
        "
      >
        {children}
      </motion.article>

      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold mb-6">相关文章</h2>
          <div className="space-y-4">
            {relatedPosts.map((related) => (
              <a key={related.slug} href={`/blog/${related.slug}`} className="block group">
                <p className="font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  {related.title}
                </p>
                <p className="text-sm text-gray-400 mt-1">{related.excerpt}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800"
      >
        <a
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回文章列表</span>
        </a>
      </motion.div>
    </>
  );
}
