/**
 * 个人博客主页面
 * 风格：极简、高留白、现代排版
 * 技术栈：React + Tailwind CSS + Framer Motion
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Github, Mail, Link2, X } from 'lucide-react';
import Navbar from './layout/Navbar';
import MobileMenu from './layout/MobileMenu';
import Footer from './layout/Footer';
import ThemeToggle from './ThemeToggle';
import Search from './Search';
import type { PostSummary } from '../types/blog';
import { siteConfig } from '../config/site';

const NAV_ITEMS = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
];

const FOOTER_LINKS = [
  { href: '/rss.xml', label: 'RSS Feed' },
  { href: '#', label: 'Privacy Policy' },
  { href: '#', label: 'Sitemap' },
];

const CONTACT_ICON_MAP = {
  github: Github,
  x: X,
  twitter: X,
  email: Mail,
  linkedin: Link2,
  website: Link2,
  xiaohongshu: Link2,
  other: Link2,
} as const;

const Hero = () => (
  <section className="mb-32">
    <div className="flex flex-col md:flex-row items-start gap-12">
      {/* 头像区域 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-shrink-0"
      >
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
            {/* 替换为你自己的头像路径 */}
            <img
              src="/avatar.png"
              alt="头像"
              className="w-full h-full object-cover"
            />
          </div>
          {/* 状态指示器 */}
          <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
        </div>
      </motion.div>

      {/* 文字介绍区域 */}
      <div className="flex-1">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          你好，我是<span className="text-gray-400">方植贤</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8"
        >
          全栈开发者 / 设计师。这里是我记录技术探索、设计心得和生活感悟的地方。
          追求极致的性能与简约的美学。
        </motion.p>

        {/* 个人标签 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {['React', 'TypeScript', 'Astro', 'UI/UX'].map((tag, index) => (
            <span
              key={tag}
              className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-6"
        >
          <a href="/blog" className="flex items-center space-x-2 text-sm font-bold border-b-2 border-black dark:border-white pb-1 hover:text-gray-500 dark:hover:text-gray-400 hover:border-gray-500 dark:hover:border-gray-400 transition-all">
            <span>查看我的文章</span>
            <ChevronRight size={16} />
          </a>
          <div className="flex items-center gap-4 text-gray-400">
            {siteConfig.contacts.map((contact) => {
              const Icon = CONTACT_ICON_MAP[contact.platform];
              const isExternal = contact.href.startsWith('http');
              return (
                <a
                  key={contact.label}
                  href={contact.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  aria-label={contact.label}
                >
                  <Icon size={20} className="hover:text-black dark:hover:text-white cursor-pointer transition-colors" />
                </a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
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
    transition={{ delay: index * 0.1 }}
    className="group cursor-pointer"
  >
    <a href={`/blog/${post.slug}`} className="block">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-12">
        <div className="md:max-w-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{post.tag}</span>
            <span className="text-xs text-gray-400 font-medium">{post.date}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
        <div className="mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
      </div>
    </a>
  </motion.article>
);

const CTASection = () => (
  <section className="mt-32 p-12 bg-black dark:bg-white text-white dark:text-black rounded-3xl flex flex-col items-center text-center">
    <h2 className="text-3xl md:text-5xl font-bold mb-6">准备好开始合作了吗？</h2>
    <p className="text-gray-400 dark:text-gray-600 mb-10 max-w-md">无论是项目咨询还是简单的打个招呼，我都非常欢迎。</p>
    <a href={siteConfig.contacts.find((contact) => contact.platform === 'email')?.href || 'mailto:hello@example.com'} className="px-8 py-4 bg-white dark:bg-black text-black dark:text-white font-bold rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
      联系我
    </a>
  </section>
);


interface Props {
  posts: PostSummary[];
}

export default function Blog({ posts }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f0f0f] text-[#1a1a1a] dark:text-[#fafafa] font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Navbar
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navItems={NAV_ITEMS}
        maxWidthClass="max-w-5xl"
        activePath="/"
      />
      <MobileMenu isOpen={isMobileMenuOpen} navItems={NAV_ITEMS} />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <Hero />

        <section id="posts">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-400">近期文章</h2>
            <a href="/blog" className="text-sm font-medium hover:underline">浏览全部</a>
          </div>

          <div className="grid gap-12">
            {posts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        </section>

        <CTASection />
      </main>

      <Footer maxWidthClass="max-w-5xl" links={FOOTER_LINKS} authorName={siteConfig.author} />
    </div>
  );
}
