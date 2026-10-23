import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';

const parser = unified().use(remarkParse);

export function toSearchBody(markdown: string): string {
  const tree = parser.parse(markdown);

  return tree.children
    .filter((node) => node.type !== 'code' && node.type !== 'html' && node.type !== 'definition')
    .map((node) => toString(node, { includeImageAlt: false, includeHtml: false }))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
