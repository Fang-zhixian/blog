export interface SearchItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  body?: string;
}

export interface Searcher {
  search: (query: string) => { item: SearchItem; matches?: readonly { key?: string; indices: readonly (readonly [number, number])[] }[] }[];
}

export function getSearchSnippet(body: string | undefined, query: string, ranges: readonly (readonly [number, number])[] = []) {
  if (!body || !query) return null;
  const exact = body.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  const best = exact >= 0 ? [exact, exact + query.length - 1] : ranges.reduce<readonly [number, number] | null>((longest, range) => !longest || range[1] - range[0] > longest[1] - longest[0] ? range : longest, null);
  if (!best) return null;
  const start = Math.max(0, best[0] - 36);
  const end = Math.min(body.length, Math.max(best[1] + 1, start + 130));
  const prefix = start > 0 ? '…' : '';
  return { text: prefix + body.slice(start, end) + (end < body.length ? '…' : ''), start: best[0] - start + prefix.length, end: Math.min(best[1] + 1, end) - start + prefix.length };
}

export function createSearchLoader(fetchIndex: typeof fetch = fetch) {
  let pending: Promise<Searcher> | undefined;

  return function loadIndex(): Promise<Searcher> {
    pending ??= Promise.all([import('fuse.js'), fetchIndex('/search.json')])
      .then(async ([{ default: Fuse }, response]) => {
        if (!response.ok) {
          throw new Error(`Search index request failed (${response.status})`);
        }
        const items: SearchItem[] = await response.json();
        return new Fuse(items, {
          keys: [
            { name: 'title', weight: 2 },
            { name: 'description', weight: 1 },
            { name: 'tags', weight: 1 },
            { name: 'body', weight: 0.4 },
          ],
          threshold: 0.35,
          ignoreLocation: true,
          includeScore: true,
          includeMatches: true,
        });
      })
      .catch((error) => {
        pending = undefined;
        throw error;
      });
    return pending;
  };
}

export function initSearch(
  root = document.querySelector<HTMLElement>('[data-search-root]'),
  loadIndex: () => Promise<Searcher> = createSearchLoader(),
) {
  const openButton = root?.querySelector<HTMLButtonElement>('[data-search-open]');
  const closeButton = root?.querySelector<HTMLButtonElement>('[data-search-close]');
  const dialog = root?.querySelector<HTMLDialogElement>('[data-search-dialog]');
  const input = root?.querySelector<HTMLInputElement>('[data-search-input]');
  const results = root?.querySelector<HTMLElement>('[data-search-results]');

  if (!openButton || !dialog || !input || !results || openButton.dataset.ready === 'true') {
    return;
  }

  openButton.dataset.ready = 'true';
  const controller = new window.AbortController();
  const { signal } = controller;
  const viewport = window.visualViewport;
  const syncViewport = () => {
    dialog.style.setProperty('--search-viewport-height', `${viewport?.height || window.innerHeight}px`);
    dialog.style.setProperty('--search-viewport-top', `${Math.max(0, viewport?.offsetTop || 0)}px`);
  };
  const onViewportChange = () => {
    // Freeze the exit height, but follow keyboard panning to keep its screen position.
    if (dialog.open) syncViewport();
    else dialog.style.setProperty('--search-viewport-top', `${Math.max(0, viewport?.offsetTop || 0)}px`);
  };
  viewport?.addEventListener('resize', onViewportChange, { signal });
  viewport?.addEventListener('scroll', onViewportChange, { signal });
  window.addEventListener('resize', onViewportChange, { signal });
  let requestId = 0;
  let selectedIndex = 0;
  let visibleResults: SearchItem[] = [];
  let loadingTimer: number | undefined;
  const snippets = new Map<string, ReturnType<typeof getSearchSnippet>>();
  const clearLoadingTimer = () => {
    window.clearTimeout(loadingTimer);
    loadingTimer = undefined;
  };

  const showStatus = (message: string) => {
    const status = document.createElement('p');
    status.className = 'min-h-28 px-4 py-8 text-center text-gray-600 dark:text-gray-300';
    status.textContent = message;
    results.replaceChildren(status);
  };

  const renderResults = (query: string, items: SearchItem[]) => {
    visibleResults = items;
    results.replaceChildren();
    if (!query) {
      showStatus('输入关键词，搜索标题和正文');
      return;
    }
    if (items.length === 0) {
      showStatus('未找到相关文章');
      return;
    }

    items.forEach((item, index) => {
      const link = document.createElement('a');
      link.href = `/blog/${encodeURIComponent(item.slug)}`;
      link.dataset.searchItem = String(index);
      link.className = `block px-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
        index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`;
      const title = document.createElement('h3');
      title.className = 'font-medium text-gray-900 dark:text-gray-100';
      title.textContent = item.title;
      const description = document.createElement('p');
      description.className = 'text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed line-clamp-3';
      const snippet = snippets.get(item.slug);
      if (snippet) {
        description.dataset.searchSnippet = 'true';
        const mark = document.createElement('mark');
        mark.className = 'rounded-sm bg-gray-200 text-gray-950 dark:bg-gray-600 dark:text-white';
        mark.textContent = snippet.text.slice(snippet.start, snippet.end);
        description.append(snippet.text.slice(0, snippet.start), mark, snippet.text.slice(snippet.end));
      } else {
        description.textContent = item.description;
      }
      link.append(title, description);
      results.append(link);
    });
  };

  const updateSelection = () => {
    results.querySelectorAll<HTMLElement>('[data-search-item]').forEach((link, index) => {
      const selected = index === selectedIndex;
      link.classList.toggle('bg-gray-100', selected);
      link.classList.toggle('dark:bg-gray-800', selected);
      link.classList.toggle('hover:bg-gray-100', !selected);
      link.classList.toggle('dark:hover:bg-gray-800', !selected);
    });
  };

  const updateResults = async () => {
    const query = input.value.trim();
    const currentRequest = ++requestId;
    selectedIndex = 0;
    visibleResults = [];
    clearLoadingTimer();
    results.setAttribute('aria-busy', 'true');
    if (!query) renderResults('', []);
    loadingTimer = window.setTimeout(() => {
      if (currentRequest === requestId && dialog.open) showStatus('正在加载搜索…');
    }, 120);
    try {
      const searcher = await loadIndex();
      if (currentRequest !== requestId || !dialog.open) return;
      const hits = query ? searcher.search(query).slice(0, 10) : [];
      snippets.clear();
      for (const hit of hits) snippets.set(hit.item.slug, getSearchSnippet(hit.item.body, query, hit.matches?.find((match) => match.key === 'body')?.indices));
      const items = hits.map((hit) => hit.item);
      renderResults(query, items);
    } catch {
      if (currentRequest === requestId && dialog.open) {
        showStatus('搜索暂时不可用，请重新输入或稍后重试');
      }
    } finally {
      if (currentRequest === requestId) {
        clearLoadingTimer();
        results.setAttribute('aria-busy', 'false');
      }
    }
  };

  const open = () => {
    if (dialog.open) return;
    document.dispatchEvent(new Event('site:search-open'));
    delete dialog.dataset.navigationClosing;
    input.value = '';
    syncViewport();
    dialog.showModal();
    input.focus({ preventScroll: true });
    void updateResults();
  };
  const close = (forNavigation = false) => {
    if (forNavigation) dialog.dataset.navigationClosing = 'true';
    if (dialog.open) dialog.close();
  };

  openButton.addEventListener('click', open, { signal });
  closeButton?.addEventListener('click', () => close(), { signal });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  }, { signal });
  dialog.addEventListener('close', () => {
    requestId += 1;
    clearLoadingTimer();
    visibleResults = [];
    snippets.clear();
    // Leave the final frame intact during the exit transition; reset on reopen.
    results.setAttribute('aria-busy', 'false');
  }, { signal });
  input.addEventListener('input', () => void updateResults(), { signal });
  results.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-search-item]') : null;
    if (!link) return;
    if (!dialog.open || results.getAttribute('aria-busy') === 'true') {
      event.preventDefault();
      return;
    }
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) close(true);
  }, { signal });
  input.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (visibleResults.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      selectedIndex = Math.max(0, Math.min(selectedIndex + delta, visibleResults.length - 1));
      updateSelection();
      results.querySelector<HTMLElement>(`[data-search-item="${selectedIndex}"]`)?.scrollIntoView?.({ block: 'nearest' });
    }
    if (event.key === 'Enter' && visibleResults[selectedIndex]) {
      event.preventDefault();
      results.querySelector<HTMLAnchorElement>(`[data-search-item="${selectedIndex}"]`)?.click();
    }
  }, { signal });
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) close();
      else open();
    }
  }, { signal });
  window.addEventListener('pagehide', () => close(true), { signal });

  return () => {
    requestId += 1;
    clearLoadingTimer();
    close(true);
    input.value = '';
    results.replaceChildren();
    controller.abort();
    dialog.style.removeProperty('--search-viewport-height');
    dialog.style.removeProperty('--search-viewport-top');
    delete openButton.dataset.ready;
  };
}
