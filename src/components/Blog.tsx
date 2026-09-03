import { ChevronRight, Github, Mail, Link2, X } from 'lucide-react';
import PostCard from './PostCard';
import type { OptimizedImage, PostSummary } from '../types/blog';
import { siteConfig } from '../config/site';

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

const Hero = ({ avatar }: { avatar: OptimizedImage }) => (
  <section className="mb-32">
    <div className="flex flex-col md:flex-row items-start gap-12">
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800">
            <img
              src={avatar.src}
              srcSet={avatar.srcSet}
              sizes="160px"
              alt={`${siteConfig.author}的头像`}
              width={avatar.width}
              height={avatar.height}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
        </div>
      </div>

      <div className="flex-1">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          你好，我是<span className="text-gray-400">{siteConfig.author}</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          全栈开发者与前沿技术探索者。游走于 AI 应用、现代 Web 与产品思维之间。擅长快速学习与整合，持续思考人机协同的未来。目前痴迷于 Vibe Coding 及一切让创造更愉悦的事物。
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {['AI Agent', 'Vibe Coding', '全栈开发', '产品设计'].map((tag) => (
            <span
              key={tag}
              className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-6">
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
        </div>
      </div>
    </div>
  </section>
);

interface Props {
  posts: PostSummary[];
  avatar: OptimizedImage;
}

export default function Blog({ posts, avatar }: Props) {
  return (
    <>
      <Hero avatar={avatar} />

      <section id="posts">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">近期文章</h2>
          <a href="/blog" className="text-sm font-medium hover:underline">浏览全部</a>
        </div>

        <div className="grid gap-12">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      </section>
    </>
  );
}
