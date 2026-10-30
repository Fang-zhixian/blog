import { describe, expect, it } from 'vitest';
import { titlePieces } from './title-wrap';

describe('article title wrapping', () => {
  it('preserves the exact title and keeps named concepts together', () => {
    const title = '把收藏夹从终点变成起点：我做了一个可与小红书素材对话的「拾页」';
    const pieces = titlePieces(title, ['小红书', 'AI工作流']);
    expect(pieces.map((piece) => piece.text).join('')).toBe(title);
    expect(pieces).toContainEqual({ text: '起点', keepTogether: true });
    expect(pieces).toContainEqual({ text: '小红书', keepTogether: true });
    expect(pieces).toContainEqual({ text: '「拾页」', keepTogether: true });
  });
  it('does not force an extremely long word to overflow', () => {
    const pieces = titlePieces('一个verylongunbreakableidentifier');
    expect(pieces.find((piece) => piece.text === 'verylongunbreakableidentifier')?.keepTogether).toBe(false);
  });
});
