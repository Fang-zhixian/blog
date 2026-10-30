import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getShareUrl, initPostActions } from './post-actions';

const markup = readFileSync('src/components/PostActions.astro', 'utf8').split('<script>')[0];
describe('article sharing', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="canonical" href="https://www.greedywolf.tech/blog/example">';
    document.body.innerHTML = markup;
    window.history.replaceState({}, '', '/blog/example');
  });
  afterEach(() => { vi.unstubAllGlobals(); document.head.replaceChildren(); document.body.replaceChildren(); });

  it('copies the local preview URL and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    initPostActions();
    document.querySelector<HTMLButtonElement>('button')!.click();
    await vi.waitFor(() => expect(document.querySelector('[data-copy-link-status]')).toHaveTextContent('链接已复制'));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/blog/example`);
  });

  it('provides a selectable link when clipboard permission is denied', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    initPostActions();
    document.querySelector<HTMLButtonElement>('button')!.click();
    await vi.waitFor(() => expect(document.querySelector('[data-copy-link-fallback]')).not.toHaveAttribute('hidden'));
    const input = document.querySelector<HTMLInputElement>('[data-copy-link-value]')!;
    expect(input.value).toBe(`${window.location.origin}/blog/example`);
    expect(input).toHaveFocus();
  });
  it('uses the canonical URL on a published host', () => {
    expect(getShareUrl({ hostname: 'www.greedywolf.tech', origin: 'https://www.greedywolf.tech', pathname: '/blog/example', href: 'https://www.greedywolf.tech/blog/example#part' }, 'https://www.greedywolf.tech/blog/example')).toBe('https://www.greedywolf.tech/blog/example');
  });
});
