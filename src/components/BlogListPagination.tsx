/**
 * 文章列表页组件（带分页）
 * 风格：极简、高留白、现代排版
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from './layout/Navbar';
import MobileMenu from './layout/MobileMenu';
import Footer from './layout/Footer';
import ThemeToggle from './ThemeToggle';
import Search from './Search';
import type { PostSummary } from '../types/blog';

const NAV_ITEMS = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
];

const FOOTER_LINKS = [
  { href: '/rss.xml', label: 'RSS Feed' },
  { href: '#', label: 'Privacy Policy' },
];

interface TagFilterProps {
  tags: string[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

const TagFilter = ({ tags, activeTag, onTagChange }: TagFilterProps) => (
  <div className="flex flex-wrap gap-3 mb-12">
    {tags.map((tag) => (
      <button
        key={tag}
        onClick={() => onTagChange(tag)}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
          activeTag === tag
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
      >
        {tag}
      </button>
    ))}
  </div>
);

interface PostCardProps {
  post: PostSummary;
  index: number;
}

const PostCard = ({ post, index }: PostCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    className="group"
  >
    <a href={`/blog/${post.slug}`} className="block">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-8 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
        <div className="md:max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{post.tag}</span>
            <span className="text-xs text-gray-400 font-medium">{post.date}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
        <div className="mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft size={24} className="text-gray-300 dark:text-gray-600 rotate-180" />
        </div>
      </div>
    </a>
  </motion.article>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

const Pagination = ({ currentPage, totalPages, basePath = '/blog' }: PaginationProps) => {
  const prevPage = currentPage > 2 ? `${basePath}/${currentPage - 1}` : (currentPage > 1 ? basePath : null);
  const nextPage = currentPage < totalPages ? `${basePath}/${currentPage + 1}` : null;

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
        <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed">
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
        <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed">
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
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function BlogListPagination({ posts, tags, currentPage, totalPages, basePath = '/blog' }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('全部');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredPosts = activeTag === '全部'
    ? posts
    : posts.filter(post => post.tag === activeTag);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f0f0f] text-[#1a1a1a] dark:text-[#fafafa] font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Navbar
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navItems={NAV_ITEMS}
        maxWidthClass="max-w-5xl"
        activePath="/blog"
      />
      <MobileMenu isOpen={isMobileMenuOpen} navItems={NAV_ITEMS} />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">全部文章</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">记录技术探索、设计心得和生活感悟</p>
        </motion.div>

        {/* 标签筛选 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <TagFilter
            tags={tags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
          />
        </motion.div>

        {/* 文章列表 */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {/* 空状态 */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>暂无文章</p>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
        )}
      </main>

      <Footer maxWidthClass="max-w-5xl" links={FOOTER_LINKS} authorName="方植贤" />
    </div>
  );
}
