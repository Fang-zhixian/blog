export interface SearchItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  body?: string;
}

export interface Searcher {
  search: (query: string) => { item: SearchItem }[];
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
  let requestId = 0;
  let selectedIndex = 0;
  let visibleResults: SearchItem[] = [];

  const showStatus = (message: string) => {
    const status = document.createElement('p');
    status.className = 'px-4 py-8 text-center text-gray-500';
    status.textContent = message;
    results.replaceChildren(status);
  };

  const renderResults = (query: string, items: SearchItem[]) => {
    visibleResults = items;
    results.replaceChildren();
    if (!query) return;
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
      description.className = 'text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2';
      description.textContent = item.description;
      link.append(title, description);
      results.append(link);
    });
  };

  const updateResults = async () => {
    const query = input.value.trim();
    const currentRequest = ++requestId;
    selectedIndex = 0;
    visibleResults = [];
    results.setAttribute('aria-busy', 'true');
    showStatus('正在加载搜索…');
    try {
      const searcher = await loadIndex();
      if (currentRequest !== requestId || !dialog.open) return;
      const items = query ? searcher.search(query).map((result) => result.item).slice(0, 10) : [];
      renderResults(query, items);
    } catch {
      if (currentRequest === requestId && dialog.open) {
        showStatus('搜索暂时不可用，请重新输入或稍后重试');
      }
    } finally {
      if (currentRequest === requestId) results.setAttribute('aria-busy', 'false');
    }
  };

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    input.focus();
    void updateResults();
  };
  const close = () => {
    if (dialog.open) dialog.close();
  };

  openButton.addEventListener('click', open, { signal });
  closeButton?.addEventListener('click', close, { signal });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  }, { signal });
  dialog.addEventListener('close', () => {
    requestId += 1;
    input.value = '';
    visibleResults = [];
    results.replaceChildren();
    results.setAttribute('aria-busy', 'false');
  }, { signal });
  input.addEventListener('input', () => void updateResults(), { signal });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (visibleResults.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      selectedIndex = Math.max(0, Math.min(selectedIndex + delta, visibleResults.length - 1));
      renderResults(input.value.trim(), visibleResults);
      results.querySelector<HTMLElement>(`[data-search-item="${selectedIndex}"]`)?.scrollIntoView?.({ block: 'nearest' });
    }
    if (event.key === 'Enter' && visibleResults[selectedIndex]) {
      event.preventDefault();
      window.location.href = `/blog/${encodeURIComponent(visibleResults[selectedIndex].slug)}`;
    }
  }, { signal });
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) close();
      else open();
    }
  }, { signal });

  return () => {
    requestId += 1;
    controller.abort();
    delete openButton.dataset.ready;
  };
}
