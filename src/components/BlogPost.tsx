import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import type { BlogEntry, PostSummary } from '../types/blog';
import { getTagPath } from '../utils/posts';

interface Props {
  post: BlogEntry;
  readingMinutes: number;
  relatedPosts: PostSummary[];
  newerPost?: PostSummary | null;
  olderPost?: PostSummary | null;
  children?: React.ReactNode;
}

export default function BlogPost({
  post,
  readingMinutes,
  relatedPosts,
  newerPost,
  olderPost,
  children,
}: Props) {
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' } as const;
  const formattedDate = new Date(post.data.pubDate).toLocaleDateString('zh-CN', dateOptions);
  const formattedUpdatedDate = post.data.updatedDate
    ? new Date(post.data.updatedDate).toLocaleDateString('zh-CN', dateOptions)
    : null;
  const tags = post.data.tags ?? [];

  return (
    <>
      <div className="mb-8">
        <a
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回文章列表</span>
        </a>
      </div>

      <header className="mb-12">
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

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>
              {formattedDate}
              {formattedUpdatedDate && formattedUpdatedDate !== formattedDate
                ? ` · 更新于 ${formattedUpdatedDate}`
                : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>阅读约 {readingMinutes} 分钟</span>
          </div>
        </div>
      </header>

      {post.data.heroImage && (
        <img
          src={post.data.heroImage}
          alt=""
          className="w-full rounded-xl mb-12"
        />
      )}

      <hr className="border-gray-200 dark:border-gray-800 mb-12" />

      <article
        className="prose prose-lg prose-gray dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-28
          prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:leading-snug
          prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-3
          prose-p:leading-[1.85] prose-p:my-5
          prose-a:text-black dark:prose-a:text-white prose-a:no-underline prose-a:border-b prose-a:border-black dark:prose-a:border-white prose-a:hover:text-gray-600 dark:prose-a:hover:text-gray-300
          prose-blockquote:border-l-4 prose-blockquote:border-black dark:prose-blockquote:border-white prose-blockquote:pl-5 prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[0.98em] prose-blockquote:leading-[1.8]
          prose-img:rounded-xl
          prose-li:marker:text-gray-400
          prose-th:text-left prose-th:align-top prose-th:font-semibold prose-th:text-[0.85em] prose-th:leading-relaxed
          prose-td:align-top prose-td:text-[0.9em] prose-td:leading-relaxed
        "
      >
        {children}
      </article>

      {(newerPost || olderPost) && (
        <nav className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 grid gap-6 md:grid-cols-2" aria-label="相邻文章">
          {newerPost ? (
            <a href={`/blog/${newerPost.slug}`} className="group">
              <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">上一篇</p>
              <p className="inline-flex items-start gap-2 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300">
                <ChevronLeft size={18} className="mt-1 shrink-0" />
                {newerPost.title}
              </p>
            </a>
          ) : (
            <div />
          )}
          {olderPost ? (
            <a href={`/blog/${olderPost.slug}`} className="group md:text-right">
              <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">下一篇</p>
              <p className="inline-flex items-start gap-2 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300 md:flex-row-reverse">
                <ChevronRight size={18} className="mt-1 shrink-0" />
                {olderPost.title}
              </p>
            </a>
          ) : (
            <div />
          )}
        </nav>
      )}

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

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
        <a
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回文章列表</span>
        </a>
      </div>
    </>
  );
}
