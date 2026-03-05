# 网站构建与上线工作流程

本文档记录了如何使用 Astro + React + Tailwind CSS 构建一个博客网站，并部署到 Vercel。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Astro | 静态站点生成框架 |
| React | 交互式组件 |
| Tailwind CSS | 样式框架 |
| Vercel | 托管与部署 |

---

## 快速开始

### 1. 创建项目

```bash
# 创建 Astro 项目
npm create astro@latest my-blog

# 进入项目目录
cd my-blog

# 安装依赖
npm install
```

### 2. 安装集成

```bash
# 添加 React 支持
npx astro add react

# 添加 Tailwind CSS
npx astro add tailwind

# 添加 sitemap
npx astro add sitemap
```

---

## 项目结构

```
my-blog/
├── public/              # 静态资源
├── src/
│   ├── components/     # React 组件
│   │   ├── layout/    # 布局组件 (Navbar, Footer, MobileMenu)
│   │   ├── Blog.tsx   # 首页组件
│   │   ├── BlogList.tsx
│   │   ├── BlogPost.tsx
│   │   ├── Search.tsx
│   │   └── ThemeToggle.tsx
│   ├── content/       # 内容集合
│   │   └── blog/      # 博客文章 (Markdown)
│   ├── layouts/       # Astro 布局
│   ├── pages/         # 路由页面
│   │   ├── index.astro
│   │   ├── about.astro
│   │   └── blog/
│   ├── styles/        # 全局样式
│   └── utils/         # 工具函数
├── astro.config.mjs   # Astro 配置
└── package.json
```

---

## 开发流程

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 添加新文章

在 `src/content/blog/` 目录下创建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "文章描述"
pubDate: 2026-03-05
tags: ["标签1", "标签2"]
---

## 内容

正文内容...
```

---

## 功能特性

### 已实现

- ✅ 响应式设计
- ✅ 暗黑模式
- ✅ 搜索功能 (Fuse.js)
- ✅ RSS 订阅
- ✅ 文章分页
- ✅ SEO 优化
- ✅ 标签筛选

### 暗黑模式

主题切换按钮集成在导航栏中，支持：
- localStorage 持久化
- 系统主题自动检测

### 搜索功能

- 客户端搜索 (Fuse.js)
- 快捷键: `Cmd/Ctrl + K`

---

## Git 工作流

### 1. 初始化 Git

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库名称
3. 点击 "Create repository"

### 3. 推送代码

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/仓库名.git

# 推送代码
git push -u origin main
```

---

## Vercel 部署

### 方式 1: 通过 GitHub 自动部署

1. 访问 https://vercel.com
2. 点击 "Add New..." → "Project"
3. 选择 GitHub 仓库
4. 点击 "Deploy"

### 方式 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

### 自定义域名

1. 在 Vercel 项目中进入 **Settings** → **Domains**
2. 添加你的域名
3. 在域名服务商处配置 DNS 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |

---

## 维护与更新

### 添加新文章

```bash
# 1. 创建新 Markdown 文件
# 2. 提交更改
git add .
git commit -m "feat: add new article"
git push origin main
```

Vercel 会自动检测并部署。

### 代码修改

修改代码后同样推送到 GitHub 即可自动部署。

---

## 常见问题

### Q: 如何修改网站标题？

编辑 `src/config/site.ts` 中的配置。

### Q: 如何修改主题颜色？

编辑 `src/styles/global.css` 中的 CSS 变量。

### Q: 如何查看构建日志？

在 Vercel Dashboard 中选择项目 → Deployments → 点击具体部署。

---

## 参考资源

- [Astro 文档](https://docs.astro.build)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Vercel 文档](https://vercel.com/docs)
