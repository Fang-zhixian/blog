export interface TitlePiece { text: string; keepTogether: boolean; }

/** Keep short, meaningful title words together without altering the title text. */
export function titlePieces(title: string, tags: string[] = []): TitlePiece[] {
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = [...new Set(tags.filter((tag) => tag.length >= 2 && tag.length <= 16 && title.includes(tag)))].sort((a, b) => b.length - a.length);
  const alternatives = [...terms.map(escape), '「[^」]{1,16}」', '《[^》]{1,16}》'];
  const split = new RegExp(`(${alternatives.join('|')})`, 'g');
  const parts = title.split(split).filter(Boolean);
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-CN', { granularity: 'word' }) : null;
  return parts.flatMap((part) => {
    if (terms.includes(part) || /^「[^」]+」$|^《[^》]+》$/.test(part)) return [{ text: part, keepTogether: true }];
    if (!segmenter) return [{ text: part, keepTogether: false }];
    return Array.from(segmenter.segment(part), ({ segment, isWordLike }) => ({ text: segment, keepTogether: Boolean(isWordLike) && Array.from(segment).length <= 12 }));
  });
}
