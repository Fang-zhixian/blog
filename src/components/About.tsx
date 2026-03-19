/**
 * 关于页面组件
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, MapPin, Calendar, Link2, X } from 'lucide-react';
import Navbar from './layout/Navbar';
import MobileMenu from './layout/MobileMenu';
import Footer from './layout/Footer';
import ThemeToggle from './ThemeToggle';
import Search from './Search';
import { siteConfig } from '../config/site';

const NAV_ITEMS = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
];

const FOOTER_LINKS = [{ href: '/blog', label: '← 返回文章列表' }];

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

export default function About() {
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
        maxWidthClass="max-w-3xl"
        activePath="/about"
      />
      <MobileMenu isOpen={isMobileMenuOpen} navItems={NAV_ITEMS} />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        {/* 头像和基本信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl flex-shrink-0">
            <img
              src="/avatar.png"
              alt="头像"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">方植贤</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">全栈开发者与前沿技术探索者</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">游走于 AI 应用、现代 Web 与产品思维之间。擅长快速学习与整合，持续思考人机协同的未来。目前痴迷于 Vibe Coding 及一切让创造更愉悦的事物。</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>中国 · 深圳</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>从事开发 2+ 年</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 个人简介 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="prose prose-lg prose-gray dark:prose-invert max-w-none mb-16"
        >
          <h2>关于我</h2>
          <p>
            你好，我是方植贤，一名对技术与创造充满热忱的开发者。
          </p>
          <p>
            我的技能树比较"横向生长"——从 React、TypeScript 前端到全栈，从数据分析、机器学习到 AI Agent 应用框架，我享受广泛涉猎与快速学习的过程。我或许不是每个领域的终极专家，但我擅长连接知识点，并用强大的信息搜索与整合能力，将想法转化为可行的解决方案。
          </p>
          <p>
            我始终保持着对技术浪潮的敏锐。今天，我的兴趣聚焦于大模型所开启的新纪元：无论是用 LangChain 等工具搭建智能体，还是实践 Vibe Coding 这种全新的编程范式，我都在亲身探索并思考，我们应如何与 AI 协同，重塑工作与创造本身。
          </p>
          <p>
            此外，一种强烈的产品思维与对未来趋势的直觉，常驱使我去构想一些"超前"的产品灵感。虽然并非所有想法都得以实现，但这种从未来回望现在的视角，让我在技术选型与设计时，总能考虑到下一步的演化方向。
          </p>
          <p>
            这个博客记录了我的学习轨迹、技术实践与不成体系的思考。如果这里的任何内容引发了你的共鸣或讨论，非常欢迎与我交流。
          </p>
        </motion.div>

        {/* 技能标签 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-lg font-bold mb-4">技术全景扫描者</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {['React', 'TypeScript', 'Astro', 'Next.js', 'Tailwind CSS', 'Node.js', 'Figma', 'UI/UX'].map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-bold mb-4">AI 与前沿探索</h3>
          <div className="flex flex-wrap gap-3">
            {['AI Agent', 'LangChain', 'LangGraph', 'Vibe Coding', '机器学习', '数据分析'].map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 联系方式 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-lg font-bold mb-4">联系方式</h3>
          <div className="flex gap-4">
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
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        </motion.div>
      </main>

      <Footer maxWidthClass="max-w-3xl" links={FOOTER_LINKS} authorName={siteConfig.author} />
    </div>
  );
}
