import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { markdownConfig } from '../config/markdown.mjs';
import { htmlToText } from './html-text.mjs';

const processor = createMarkdownProcessor({ ...markdownConfig, syntaxHighlight: false });

export async function toSearchBody(markdown: string, frontmatter: Record<string, unknown> = {}): Promise<string> {
  const { code } = await (await processor).render(markdown, { frontmatter });
  return htmlToText(code);
}
