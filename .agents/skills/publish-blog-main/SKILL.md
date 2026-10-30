---
name: publish-blog-main
description: Publishes blog updates from this repository directly to the main branch on GitHub, including build verification and safe git checks. Use when the user asks to publish a post, push文章到GitHub, 上线博客, 发布到主分支, or deploy via Vercel auto-deploy.
---

# Publish Blog To Main

## Purpose

Use this skill to publish blog changes quickly for a single-maintainer workflow:

1. Validate build locally
2. Commit blog-related changes
3. Push to `main`
4. Let Vercel auto-deploy from GitHub

## Default Workflow

Follow these steps in order:

1. Confirm current branch is `main`
2. Run `npm run build`
3. Inspect git changes (`git status --short`)
4. Stage only relevant files (blog/raw/docs/scripts as requested)
5. Commit with a clear message
6. Push to `origin main`
7. Report final production URL checks

## Safety Rules

- Do not use destructive git commands
- Do not commit secrets (`.env`, keys, credentials)
- If build fails, stop and fix before commit
- If unrelated dirty changes exist, ask whether to include or exclude them
- If push is rejected, pull/rebase only after user confirmation

## Commit Message Style

Use concise, purpose-first messages:

- `feat(blog): publish <post-slug> article`
- `fix(blog): correct frontmatter for <post-slug>`
- `chore(content): update raw-to-blog workflow docs`

## Command Template

Use this exact sequence when user says “发布/上线这篇文章”:

```bash
npm run build
git status --short
git add <relevant-files>
git commit -m "feat(blog): publish <post-slug> article"
git push origin main
```

## Done Criteria

Only consider done when:

- build passes
- push to `main` succeeds
- user gets verification links:
  - `https://www.greedywolf.tech/blog/<post-slug>`
  - `https://www.greedywolf.tech/blog`
