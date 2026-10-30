import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchLoader, getSearchSnippet, initSearch } from './search';
import type { SearchItem, Searcher } from './search';

const markup = readFileSync('src/components/Search.astro', 'utf8').split('<script>')[0];
const item = (title: string): SearchItem => ({ slug: title, kind: 'article', href: `/blog/${encodeURIComponent(title)}`, title, description: '描述', tags: [], date: '2026-10-23' });
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

  it('prefers exact short technical terms over weak fuzzy matches', async () => {
    const entries: SearchItem[] = [
      { ...item('拾页'), tags: ['OCR'], description: '对图片执行 OCR', body: '按需识别素材。' },
      { ...item('陪伴产品'), body: 'A report by Beken Corp. (2025).' },
      { ...item('直播录制'), body: 'Use the --record option.' },
    ];
    const load = createSearchLoader(vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(entries))));
    expect((await load()).search('OCR').map((result) => result.item.title)).toEqual(['拾页']);
  });

  it('finds titles and summaries in both languages across content types', async () => {
    const entries: SearchItem[] = [
      { ...item('拾页文章'), titleEn: 'Shiye article', description: '本地素材', descriptionEn: 'A searchable collection' },
      { ...item('拾页'), slug: 'project:shiye', kind: 'project', href: '/projects/shiye/', titleEn: 'Shiye', descriptionEn: 'A local collection workspace' },
      { ...item('按需 OCR'), slug: 'knowledge:ocr', kind: 'knowledge', href: '/knowledge/ocr/', titleEn: 'On-Demand OCR' },
      { ...item('关于'), slug: 'page:about', kind: 'page', href: '/about/', body: '我学习机器学习。', bodyEn: 'I explore machine learning.' },
    ];
    const load = createSearchLoader(vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(entries))));
    const search = (await load()).search;
    expect(search('Shiye').map(({ item: result }) => result.href)).toEqual(expect.arrayContaining(['/projects/shiye/', '/blog/%E6%8B%BE%E9%A1%B5%E6%96%87%E7%AB%A0']));
    expect(search('OCR').some(({ item: result }) => result.kind === 'knowledge')).toBe(true);
    expect(search('machine learning').some(({ item: result }) => result.href === '/about/')).toBe(true);
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
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete document.documentElement.dataset.lang;
    document.body.replaceChildren();
  });

  const open = () => root.querySelector<HTMLButtonElement>('[data-search-open]')!.click();
  const type = (query: string) => {
    input.value = query;
    input.dispatchEvent(new Event('input'));
  };

  it('uses English feedback when the interface language is English', async () => {
    document.documentElement.dataset.lang = 'en';
    dispose = initSearch(root, async () => ({ search: () => [] }));
    open();
    expect(results).toHaveTextContent('Search articles, projects, notes, and knowledge');
    type('missing');
    await vi.waitFor(() => expect(results).toHaveTextContent('No matching content'));
  });

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

  it('shows content types and routes each result to its own section', async () => {
    const article = item('拾页');
    const project: SearchItem = { ...article, slug: 'project:shiye', kind: 'project', href: '/projects/shiye/', title: '拾页作品' };
    const note: SearchItem = { ...article, slug: 'note:shiye', kind: 'note', href: '/notes/shiye/', title: '拾页笔记' };
    dispose = initSearch(root, async () => ({ search: () => [article, project, note].map((entry) => ({ item: entry })) }));
    open(); type('拾页');
    await vi.waitFor(() => expect(results.querySelectorAll('a')).toHaveLength(3));
    const links = [...results.querySelectorAll('a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/blog/%E6%8B%BE%E9%A1%B5', '/projects/shiye/', '/notes/shiye/']);
    expect(links.map((link) => link.querySelector('.search-result-type')?.textContent)).toEqual(['文章', '作品', '笔记']);
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

  it('uses the English summary instead of a Chinese body snippet in English mode', async () => {
    document.documentElement.dataset.lang = 'en';
    const entry = { ...item('拾页'), titleEn: 'Shiye', body: '正文介绍 OCR。', descriptionEn: 'Organize a collection with OCR.' };
    dispose = initSearch(root, async () => ({ search: () => [{ item: entry }] }));
    open(); type('OCR');
    await vi.waitFor(() => expect(results.querySelector('mark')).toHaveTextContent('OCR'));
    expect(results).toHaveTextContent('Organize a collection with OCR.');
    expect(results).not.toHaveTextContent('正文介绍');
    expect(results.querySelector('p[lang="en"]')).not.toBeNull();
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

  it('hands off from the mobile menu before showing search by button or shortcut', () => {
    const handoff = vi.fn(() => expect(dialog.open).toBe(false));
    document.addEventListener('site:search-open', handoff);
    dispose = initSearch(root, async () => searcher);
    open();
    dialog.close();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    expect(handoff).toHaveBeenCalledTimes(2);
    document.removeEventListener('site:search-open', handoff);
  });

  it('fits the visual viewport as a software keyboard opens without moving the exit frame', () => {
    const viewport = Object.assign(new window.EventTarget(), { height: 844, offsetTop: 0 });
    vi.stubGlobal('visualViewport', viewport);
    dispose = initSearch(root, async () => searcher);
    open();
    expect(dialog.style.getPropertyValue('--search-viewport-height')).toBe('844px');
    viewport.height = 320;
    viewport.offsetTop = 24;
    viewport.dispatchEvent(new Event('resize'));
    expect(dialog.style.getPropertyValue('--search-viewport-height')).toBe('320px');
    expect(dialog.style.getPropertyValue('--search-viewport-top')).toBe('24px');
    dialog.close();
    viewport.height = 844;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('resize'));
    expect(dialog.style.getPropertyValue('--search-viewport-height')).toBe('320px');
    expect(dialog.style.getPropertyValue('--search-viewport-top')).toBe('0px');
    open();
    expect(dialog.style.getPropertyValue('--search-viewport-height')).toBe('844px');
    dispose?.();
    viewport.height = 400;
    viewport.dispatchEvent(new Event('scroll'));
    expect(dialog.style.getPropertyValue('--search-viewport-height')).toBe('');
    dispose = undefined;
  });

  it('closes search before history caching and remains usable after returning', () => {
    dispose = initSearch(root, async () => searcher);
    open();
    window.dispatchEvent(new Event('pagehide'));
    expect(dialog.open).toBe(false);
    expect(dialog).toHaveAttribute('data-navigation-closing', 'true');
    open();
    expect(dialog.open).toBe(true);
    expect(dialog).not.toHaveAttribute('data-navigation-closing');
    expect(dialog.style.getPropertyValue('--search-viewport-height')).toBe(`${window.innerHeight}px`);
  });

  it.each(['site:toc-open', 'site:image-open'])('releases the search overlay before %s', (eventName) => {
    dispose = initSearch(root, async () => searcher);
    open();
    document.dispatchEvent(new Event(eventName));
    expect(dialog.open).toBe(false);
    expect(dialog).toHaveAttribute('data-navigation-closing', 'true');
  });
});
