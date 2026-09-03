export interface ContactLink {
  platform: 'github' | 'x' | 'twitter' | 'email' | 'linkedin' | 'website' | 'xiaohongshu' | 'other';
  label: string;
  href: string;
}

export interface FeaturedProject {
  title: string;
  description: string;
  href: string;
  repo?: string;
}

export const navItems = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
];

export const footerLinks = [
  { href: '/rss.xml', label: 'RSS Feed' },
  { href: '/privacy', label: '隐私说明' },
  { href: '/sitemap-index.xml', label: 'Sitemap' },
];

export const featuredProjects: FeaturedProject[] = [
  {
    title: 'Live Capture',
    description:
      '香港活动去不成，就把视频号直播留下来。电脑伪装成电视拿到 m3u8，再用一个很小的 macOS 界面盯着 ffmpeg 还活着。',
    href: '/blog/live-capture',
    repo: 'https://github.com/Fang-zhixian/live-capture',
  },
];

export const siteConfig = {
  name: '方植贤',
  title: '方植贤',
  description: '全栈开发者与前沿技术探索者。记录 AI 应用、现代 Web 与产品思考。',
  url: 'https://www.greedywolf.tech',
  author: '方植贤',
  featuredProjects,
  contacts: [
    {
      platform: 'github',
      label: 'GitHub',
      href: 'https://github.com/Nothings2Seeyeyeye',
    },
    {
      platform: 'email',
      label: 'Email',
      href: 'mailto:2634562642@qq.com',
    },
  ] satisfies ContactLink[],
};
