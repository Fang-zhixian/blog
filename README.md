# 个人博客

方植贤的个人站点，线上地址 [www.greedywolf.tech](https://www.greedywolf.tech)。Astro SSG，页面默认不向浏览器下发 React。

## 技术栈

- **Astro** - 静态站点生成，导航 / 搜索 / 主题 / 目录用原生脚本
- **React** - 仅构建期渲染首页、列表、关于、文章模板，没有 `client:load`
- **Tailwind CSS** - 样式
- **Markdown + astro:assets** - 文章与配图

## 项目结构

```
my-blog/
├── src/
│   ├── assets/               # 头像与文章配图（构建时出 WebP / srcset）
│   ├── components/
│   │   ├── layout/           # Navbar.astro、Footer
│   │   ├── Search.astro      # 打开后再拉 /search.json
│   │   ├── Blog.tsx          # 首页（SSR）
│   │   ├── BlogPost.tsx      # 文章壳（SSR）
│   │   └── About.tsx         # 关于页（SSR）
│   ├── content/blog/         # 已发布文 + draft 模板文
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── search.json.ts
│   │   └── blog/[slug].astro
│   └── styles/global.css
├── astro.config.mjs
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

## Raw 笔记 -> 发布文章（LLM 生成）

如果你先写零散笔记，再让模型整理成可上线文章，可以使用：

1. 在 `raw/` 新建 raw 文件（可参考 `raw/_template.md`）
2. 配置环境变量：

```bash
export LLM_API_KEY="your_key"
export LLM_MODEL="gpt-4.1-mini"
# 可选，兼容 OpenAI 风格接口
export LLM_BASE_URL="https://api.openai.com/v1"
```

3. 生成发布稿：

```bash
npm run raw:generate -- --input raw/your-note.md
```

4. 生成后会输出到 `src/content/blog/*.md`，再执行本地预览和发布流程。

常用参数：
- `--dry-run`：只打印结果，不写文件
- `--slug xxx`：指定输出文件名
- `--force`：覆盖已存在文章

## 可自定义的内容

### 1. 修改个人信息

编辑 `src/components/Blog.tsx`：

- 名字：`src/config/site.ts` 里的 `siteConfig.author`
- 头像：替换 `src/assets/avatar.png`
- 技能标签：修改首页 Hero 中的标签数组
- 社交链接：修改 `src/config/site.ts` 中的 `contacts`

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

- 访问 https://www.greedywolf.tech 查看网站
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
