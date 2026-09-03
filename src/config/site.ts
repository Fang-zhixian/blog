export interface ContactLink {
  platform: 'github' | 'x' | 'twitter' | 'email' | 'linkedin' | 'website' | 'xiaohongshu' | 'other';
  label: string;
  href: string;
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

export const siteConfig = {
  name: '方植贤',
  title: '方植贤',
  description: '全栈开发者与前沿技术探索者。记录 AI 应用、现代 Web 与产品思考。',
  url: 'https://www.greedywolf.tech',
  author: '方植贤',
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
