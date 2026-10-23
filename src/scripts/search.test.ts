import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchLoader, initSearch } from './search';
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
    dialog.close();
    pending.resolve(searcher);
    await pending.promise;
    expect(results).toBeEmptyDOMElement();
    expect(input.value).toBe('');
  });

  it('shows loading and failure feedback, then recovers on further input', async () => {
    const load = vi.fn<() => Promise<Searcher>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(searcher);
    dispose = initSearch(root, load);
    open();
    expect(results).toHaveAttribute('aria-busy', 'true');
    expect(results).toHaveTextContent('正在加载搜索');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(results).toHaveTextContent('正在加载搜索');
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
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(results.querySelector('[data-search-item="1"]')).toHaveClass('bg-gray-100');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(dialog.open).toBe(false);
  });

  it('closes a populated search dialog on the first Escape key', async () => {
    dispose = initSearch(root, async () => searcher);
    open();
    type('尚未清空的搜索');
    await vi.waitFor(() => expect(results.querySelector('h3')).toHaveTextContent('尚未清空的搜索'));
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(input.value).toBe('');
    expect(results).toBeEmptyDOMElement();
  });
});
