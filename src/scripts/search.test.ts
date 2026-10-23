import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchLoader, getSearchSnippet, initSearch } from './search';
import type { SearchItem, Searcher } from './search';

const markup = readFileSync('src/components/Search.astro', 'utf8').split('<script>')[0];
const item = (title: string): SearchItem => ({ slug: title, title, description: '描述', tags: [], date: '2026-10-23' });
const searcher: Searcher = { search: (query) => [{ item: item(query) }] };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('search index loading', () => {
  it('extracts the matching passage beyond the article introduction', () => {
    const body = `${'开头内容。'.repeat(1000)}所以说大道至简🤔.....?`;
    const snippet = getSearchSnippet(body, '大道至简')!;
    expect(snippet.text).toContain('所以说大道至简🤔.....?');
    expect(snippet.text.slice(snippet.start, snippet.end)).toBe('大道至简');
    expect(snippet.text.length).toBeLessThan(150);
  });
  it('shares the first request across opening and rapid input, then caches it', async () => {
    const response = deferred<Response>();
    const fetchIndex = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    const load = createSearchLoader(fetchIndex);
    const first = load();
    const second = load();
    expect(first).toBe(second);
    response.resolve(new Response(JSON.stringify([item('Astro')])));
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect((await load()).search('Astro')[0].item.title).toBe('Astro');
    expect(fetchIndex).toHaveBeenCalledTimes(1);
  });

  it('rejects HTTP errors and allows retrying after failure', async () => {
    const fetchIndex = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([item('恢复')])));
    const load = createSearchLoader(fetchIndex);
    await expect(load()).rejects.toThrow('503');
    expect((await load()).search('恢复')).toHaveLength(1);
    expect(fetchIndex).toHaveBeenCalledTimes(2);
  });
});

describe('search dialog', () => {
  let root: HTMLElement;
  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let results: HTMLElement;
  let dispose: ReturnType<typeof initSearch>;

  beforeEach(() => {
    document.body.innerHTML = markup;
    root = document.querySelector('[data-search-root]')!;
    dialog = root.querySelector('dialog')!;
    input = root.querySelector('input')!;
    results = root.querySelector('[data-search-results]')!;
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => {
      dialog.open = false;
      dialog.dispatchEvent(new Event('close'));
    };
  });

  afterEach(() => {
    dispose?.();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  const open = () => root.querySelector<HTMLButtonElement>('[data-search-open]')!.click();
  const type = (query: string) => {
    input.value = query;
    input.dispatchEvent(new Event('input'));
  };

  it('keeps the latest results when older requests finish last', async () => {
    const old = deferred<Searcher>();
    const latest = deferred<Searcher>();
    const load = vi.fn<() => Promise<Searcher>>()
      .mockResolvedValueOnce(searcher)
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(latest.promise);
    dispose = initSearch(root, load);
    open();
    type('旧查询');
    type('新查询');
    latest.resolve(searcher);
    await vi.waitFor(() => expect(results).toHaveTextContent('新查询'));
    old.resolve(searcher);
    await old.promise;
    expect(results).toHaveTextContent('新查询');
    expect(results).not.toHaveTextContent('旧查询');
    expect(results).toHaveAttribute('aria-busy', 'false');
  });

  it('ignores requests that finish after the dialog closes', async () => {
    const pending = deferred<Searcher>();
    dispose = initSearch(root, () => pending.promise);
    open();
    type('延迟结果');
    const closingContent = results.innerHTML;
    dialog.close();
    pending.resolve(searcher);
    await pending.promise;
    expect(dialog.open).toBe(false);
    expect(results.innerHTML).toBe(closingContent);
  });

  it('shows loading and failure feedback, then recovers on further input', async () => {
    const load = vi.fn<() => Promise<Searcher>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(searcher);
    dispose = initSearch(root, load);
    open();
    expect(results).toHaveAttribute('aria-busy', 'true');
    expect(results).toHaveTextContent('输入关键词');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(results).toHaveTextContent('输入关键词');
    await vi.waitFor(() => expect(results).toHaveTextContent('搜索暂时不可用'));
    type('恢复');
    await vi.waitFor(() => expect(results.querySelector('h3')).toHaveTextContent('恢复'));
    expect(results).toHaveAttribute('aria-busy', 'false');
  });

  it('supports keyboard opening and selection while rendering titles as text', async () => {
    dispose = initSearch(root, async () => ({ search: () => [{ item: item('<img src=x onerror=alert(1)>') }, { item: item('第二篇') }] }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(dialog.open).toBe(true);
    expect(input).toHaveFocus();
    type('文章');
    await vi.waitFor(() => expect(results.querySelectorAll('a')).toHaveLength(2));
    expect(results.querySelector('img')).toBeNull();
    expect(results).toHaveTextContent('<img src=x onerror=alert(1)>');
    const originalLink = results.querySelector('[data-search-item="1"]');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(results.querySelector('[data-search-item="1"]')).toHaveClass('bg-gray-100');
    expect(results.querySelector('[data-search-item="1"]')).toBe(originalLink);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(dialog.open).toBe(false);
  });

  it('closes on the first Escape without collapsing the exit frame and resets on reopen', async () => {
    dispose = initSearch(root, async () => searcher);
    open();
    type('尚未清空的搜索');
    await vi.waitFor(() => expect(results.querySelector('h3')).toHaveTextContent('尚未清空的搜索'));
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(results.querySelector('h3')).toHaveTextContent('尚未清空的搜索');
    open();
    expect(input.value).toBe('');
    expect(results).toHaveTextContent('输入关键词');
  });

  it('shows a highlighted matching paragraph instead of an unrelated description', async () => {
    dispose = initSearch(root, async () => ({ search: () => [{ item: { ...item('文章'), body: '前文。<script>大道至简</script>。后文。' } }] }));
    open();
    type('大道至简');
    await vi.waitFor(() => expect(results.querySelector('mark')).toHaveTextContent('大道至简'));
    expect(results.querySelector('[data-search-snippet]')).toHaveTextContent('<script>大道至简</script>');
    expect(results.querySelector('script')).toBeNull();
  });

  it('delays loading feedback and cancels it when the dialog closes', async () => {
    vi.useFakeTimers();
    const pending = deferred<Searcher>();
    dispose = initSearch(root, () => pending.promise);
    open();
    expect(results).not.toHaveTextContent('正在加载搜索');
    await vi.advanceTimersByTimeAsync(150);
    expect(results).toHaveTextContent('正在加载搜索');
    const closingContent = results.innerHTML;
    dialog.close();
    pending.resolve(searcher);
    await vi.advanceTimersByTimeAsync(200);
    expect(dialog.open).toBe(false);
    expect(results.innerHTML).toBe(closingContent);
  });

  it('closes the overlay before ordinary navigation but preserves modifier-click behavior', async () => {
    dispose = initSearch(root, async () => searcher);
    open(); type('文章');
    await vi.waitFor(() => expect(results.querySelector('a')).not.toBeNull());
    const link = results.querySelector('a')!;
    link.addEventListener('click', (event) => event.preventDefault());
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(dialog.open).toBe(true);
    link.click();
    expect(dialog.open).toBe(false);
    expect(dialog).toHaveAttribute('data-navigation-closing', 'true');
  });

  it('does not navigate while Enter is committing an input-method composition', async () => {
    dispose = initSearch(root, async () => searcher);
    open(); type('中文');
    await vi.waitFor(() => expect(results.querySelector('a')).not.toBeNull());
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    expect(dialog.open).toBe(true);
  });
});
