---
title: "掌握 CSS Grid 布局"
description: "现代 CSS 为我们提供了强大的布局能力，Grid 和 Flexbox 的组合可以应对各种复杂的页面设计。"
pubDate: "2024-02-01"
tags: ["前端", "CSS"]
---

## 为什么选择 Grid？

CSS Grid 是第一个专门为二维布局设计的 CSS 模块。与 Flexbox 的一维布局相比，Grid 能更优雅地处理复杂的页面结构。

## 基础语法

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
```

## 实战示例：经典博客布局

```css
.blog-layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

## Grid vs Flexbox

| 场景 | 推荐 |
|------|------|
| 整体页面布局 | Grid |
| 导航菜单 | Flexbox |
| 卡片网格 | Grid |
| 按钮组 | Flexbox |
| 相册图片墙 | Grid |

## 响应式技巧

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

`auto-fit` + `minmax` 的组合让你不需要编写任何媒体查询就能实现响应式布局！

## 结语

掌握 Grid 和 Flexbox，理论上你可以实现任何 CSS 布局。关键是要理解它们的适用场景，而不是试图用一种技术解决所有问题。
