# 个人博客

极简风格的个人博客，基于 Astro + React + Tailwind CSS 构建。

## 技术栈

- **Astro** - 静态站点生成器
- **React** - 交互组件
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画效果
- **Markdown** - 文章内容管理

## 项目结构

```
my-blog/
├── src/
│   ├── components/           # React 组件
│   │   ├── Blog.tsx         # 首页组件
│   │   ├── BlogList.tsx     # 文章列表组件
│   │   ├── BlogPost.tsx     # 文章详情组件
│   │   └── About.tsx        # 关于页面组件
│   ├── content/
│   │   └── blog/            # Markdown 文章目录
│   │       ├── astro-performance.md
│   │       ├── design-whitespace.md
│   │       └── ...
│   ├── pages/
│   │   ├── index.astro     # 首页
│   │   ├── about.astro      # 关于页
│   │   └── blog/
│   │       ├── index.astro  # 文章列表页
│   │       └── [...slug].astro  # 文章详情页
│   └── styles/
│       └── global.css       # Tailwind 样式
├── public/                  # 静态资源
├── astro.config.mjs         # Astro 配置
├── tailwind.config.mjs      # Tailwind 配置
└── package.json
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:4321

## 添加新文章

在 `src/content/blog/` 目录下创建新的 Markdown 文件：

```markdown
---
title: "文章标题"
description: "文章简介，会显示在列表页"
pubDate: "2024-03-25"
tags: ["技术", "前端"]
---

这里是文章正文内容...

## 二级标题

支持 Markdown 语法：

- 列表项
- **粗体**
- [链接](https://example.com)

### 代码块

```javascript
function hello() {
  console.log('Hello World');
}
```
```

## 可自定义的内容

### 1. 修改个人信息

编辑 `src/components/Blog.tsx`：

- 名字：`陈志贤`
- 头像：替换 `<img src="...">` 中的 URL
- 技能标签：修改 `['React', 'TypeScript', ...]` 数组
- 社交链接：修改 `href="https://github.com"` 等

### 2. 修改关于页面

编辑 `src/components/About.tsx`：

- 个人简介文字
- 技能栈数组
- 联系方式链接

### 3. 修改页脚

在各组件中搜索 `Footer` 函数，修改版权信息。

## 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建完成后，静态文件会生成在 `dist/` 目录。

## 部署平台

可以将 `dist/` 目录部署到任何静态托管服务：

| 平台 | 说明 |
|------|------|
| Vercel | `npx vercel deploy` |
| Netlify | 拖拽 dist 文件夹或连接 GitHub |
| Cloudflare Pages | `npx wrangler pages deploy dist` |
| GitHub Pages | 使用 GitHub Actions |

## 更新博客流程

### 1. 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:4321 预览
```

### 2. 添加新文章

在 `src/content/blog/` 目录下创建新的 Markdown 文件，参考"添加新文章"部分。

### 3. 提交更新

```bash
# 添加所有修改
git add .

# 提交更新
git commit -m "Add new post"

# 推送到 GitHub
git push
```

### 4. 自动部署

Vercel 会自动检测到 GitHub 上的更新，并重新部署网站。

- 访问 https://greedywolf.tech 查看网站
- 访问 https://vercel.com/dashboard 查看部署状态

---

## 命令列表

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `git add .` | 添加所有修改 |
| `git commit -m "..."` | 提交更新 |
| `git push` | 推送到 GitHub |

## 注意事项

- 本项目使用 **SSG (Static Site Generation)** 模式
- 无需数据库，所有内容通过 Markdown 文件管理
- 添加新文章后需要重新构建 (`npm run build`)
