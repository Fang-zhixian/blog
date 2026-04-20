# Raw Notes Workflow

`raw/` is for private draft notes.  
Use the generator script to turn a raw note into a publishable file in `src/content/blog/`.

## 1) Create a raw note

Create a file like `raw/my-topic.md`:

```markdown
---
title: "Astro 性能优化实战"
description: "从 70 到 95 的性能优化记录"
pubDate: "2026-04-20"
tags: ["Astro", "性能优化"]
slug: "astro-perf-practice"
---

我遇到的问题：
- 首页 LCP 很高
- 图片太大

我做了这些尝试：
- 改了图片尺寸和格式
- 减少首屏 JS
- 调整字体加载策略

最后结果：
- Lighthouse 从 70 提升到 95
```

## 2) Generate the publishable post

Set env vars first:

```bash
export LLM_API_KEY="your_key"
export LLM_MODEL="gpt-4.1-mini"
# optional
export LLM_BASE_URL="https://api.openai.com/v1"
```

Run:

```bash
npm run raw:generate -- --input raw/my-topic.md
```

Output:
- `src/content/blog/astro-perf-practice.md` (or based on filename/title when slug is missing)

## 3) Review + publish

Review the generated markdown, then:

```bash
npm run dev
git add .
git commit -m "Add new post from raw notes"
git push
```

## Useful flags

- `--dry-run`: print generated markdown without writing files
- `--slug xxx`: force output filename
- `--force`: overwrite existing target markdown
