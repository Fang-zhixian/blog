import { fromHtml } from 'hast-util-from-html';
import { toText } from 'hast-util-to-text';

export function htmlToText(html) {
  return toText(fromHtml(html, { fragment: true })).replace(/\s+/g, ' ').trim();
}
