/**
 * 文章详情页组件
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Calendar } from 'lucide-react';
import Navbar from './layout/Navbar';
import MobileMenu from './layout/MobileMenu';
import Footer from './layout/Footer';
import type { BlogEntry } from '../types/blog';

const NAV_ITEMS = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
];

const FOOTER_LINKS = [{ href: '/blog', label: '← 返回文章列表' }];

interface Props {
  post: BlogEntry;
  children?: React.ReactNode;
}

export default function BlogPost({ post, children }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formattedDate = new Date(post.data.pubDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      <Navbar
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navItems={NAV_ITEMS}
        maxWidthClass="max-w-3xl"
        activePath="/blog"
      />
      <MobileMenu isOpen={isMobileMenuOpen} navItems={NAV_ITEMS} />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
            <span>返回文章列表</span>
          </a>
        </motion.div>

        {/* 文章头部 */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          {/* 标签 */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
              {post.data.tags?.[0] || '文章'}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] mb-6">
            {post.data.title}
          </h1>

          {/* 元信息 */}
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>阅读约 5 分钟</span>
            </div>
          </div>
        </motion.header>

        {/* 分割线 */}
        <hr className="border-gray-200 mb-12" />

        {/* 文章内容 */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-a:text-black prose-a:no-underline prose-a:border-b prose-a:border-black prose-a:hover:text-gray-600 prose-a:hover:border-gray-500
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-6 prose-blockquote:italic
            prose-img:rounded-xl
          "
        >
          {children}
        </motion.article>

        {/* 文章底部 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-gray-200"
        >
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
            <span>返回文章列表</span>
          </a>
        </motion.div>
      </main>

      <Footer maxWidthClass="max-w-3xl" links={FOOTER_LINKS} authorName="方植贤" />
    </div>
  );
}
