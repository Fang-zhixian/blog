import { Github, Mail, MapPin, Calendar, Link2, X } from 'lucide-react';
import { siteConfig } from '../config/site';
import type { OptimizedImage } from '../types/blog';

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

interface Props {
  avatar: OptimizedImage;
}

export default function About({ avatar }: Props) {
  const emailHref = siteConfig.contacts.find((contact) => contact.platform === 'email')?.href;

  return (
    <>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 flex-shrink-0">
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

        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{siteConfig.author}</h1>
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
      </div>

      <div className="prose prose-lg prose-gray dark:prose-invert max-w-none mb-16">
        <h2>关于我</h2>
        <p>
          你好，我是方植贤。这个博客只写我自己做过、想清楚的事。
        </p>
        <p>
          最近一条完整链路是：活动现场去不成，就把视频号直播录下来，再准备转成文字给 AI 摘要。卡住的不是模型，是怎么稳定拿到流、怎么让 ffmpeg 在电脑睡着之前还活着。我把它做成了 Live Capture，过程写在文章里。
        </p>
        <p>
          技能树比较横向——React、TypeScript、全栈，到 AI Agent 和产品直觉。我不是每个领域的终极专家，但习惯把想法收成能跑的东西，并记下取舍。
        </p>
        <p>
          如果某篇文章或项目对上了你正在做的事，欢迎来信。
        </p>
      </div>

      <div className="mb-16">
        <h3 className="text-lg font-bold mb-6">项目</h3>
        <div className="space-y-8">
          {siteConfig.featuredProjects.map((project) => (
            <div key={project.href}>
              <p className="font-medium mb-2">
                <a href={project.href} className="hover:text-gray-600 dark:hover:text-gray-300">
                  {project.title}
                </a>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <a href={project.href} className="border-b border-black dark:border-white pb-0.5">
                  阅读实践记录
                </a>
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-16">
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
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">联系方式</h3>
        <div className="flex gap-4 mb-6">
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
        {emailHref && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            想讨论文章或项目，可以直接
            <a href={emailHref} className="mx-1 border-b border-black dark:border-white">
              写信给我
            </a>
            。
          </p>
        )}
      </div>
    </>
  );
}
