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
  name: 'DESIGNER.BLOG',
  title: 'DESIGNER.BLOG',
  description: '极简风格的个人博客',
  url: 'https://greedywolf.tech',
  author: '方植贤',
  twitterHandle: '@greedywolf',
  contacts: [
    {
      platform: 'github',
      label: 'GitHub',
      href: 'https://github.com/Fang-zhixian',
    },
    {
      platform: 'email',
      label: 'Email',
      href: 'mailto:2634562642@qq.com',
    },
  ] satisfies ContactLink[],
};
