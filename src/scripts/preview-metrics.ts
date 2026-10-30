export interface MetricSnapshot {
  site: { visits: number; likes: number; liked: boolean };
  article: { views: number; likes: number; liked: boolean } | null;
}
type LikeKind = 'site' | 'article';
interface Options { getLanguage: () => 'zh' | 'en'; fetcher?: typeof fetch; }

const get = (storage: Storage, key: string) => { try { return storage.getItem(key); } catch { return null; } };
const set = (storage: Storage, key: string, value: string) => { try { storage.setItem(key, value); } catch { /* Private mode may disable storage. */ } };
function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `preview_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}
function stableId(storage: Storage, key: string) {
  const current = get(storage, key);
  if (current && /^[A-Za-z0-9_-]{16,80}$/.test(current)) return current;
  const next = newId(); set(storage, key, next); return next;
}

/** The endpoint uses local storage in preview and shared storage in production. */
export function initPreviewMetrics({ getLanguage, fetcher = fetch }: Options) {
  const visitorId = stableId(localStorage, 'rumo-preview-visitor-id');
  const sessionId = stableId(sessionStorage, 'rumo-preview-session-id');
  const slug = document.querySelector<HTMLElement>('[data-article-slug]')?.dataset.articleSlug || null;
  let snapshot: MetricSnapshot | null = null;
  let unavailable = false;
  let pending = true;
  let visitRecorded = false;
  const controller = new window.AbortController();
  const count = (value: number) => new Intl.NumberFormat(getLanguage() === 'en' ? 'en' : 'zh-CN').format(value);

  function render() {
    const en = getLanguage() === 'en';
    document.querySelectorAll<HTMLButtonElement>('[data-like-site]').forEach((button) => {
      const liked = snapshot?.site.liked ?? false;
      button.setAttribute('aria-pressed', String(liked)); button.disabled = pending;
      const label = button.querySelector<HTMLElement>('[data-like-label]');
      const number = button.querySelector<HTMLElement>('[data-like-count]');
      if (label) label.textContent = en ? (liked ? 'Liked this site' : 'Like this site') : (liked ? '已喜欢这个小站' : '喜欢这个小站');
      if (number) number.textContent = snapshot ? count(snapshot.site.likes) : unavailable ? '—' : '…';
    });
    document.querySelectorAll<HTMLButtonElement>('[data-like-article]').forEach((button) => {
      const liked = snapshot?.article?.liked ?? false;
      button.setAttribute('aria-pressed', String(liked)); button.disabled = pending;
      const label = button.querySelector<HTMLElement>('[data-like-label]');
      const number = button.querySelector<HTMLElement>('[data-like-count]');
      if (label) label.textContent = en ? (liked ? 'Marked helpful' : 'Helpful') : (liked ? '已标记有帮助' : '有帮助');
      if (number) number.textContent = snapshot?.article ? count(snapshot.article.likes) : unavailable ? '—' : '…';
    });
    document.querySelectorAll<HTMLElement>('[data-site-visits]').forEach((element) => {
      const number = snapshot ? count(snapshot.site.visits) : unavailable ? '—' : '…';
      element.textContent = en ? `${number} ${snapshot?.site.visits === 1 ? 'visit' : 'visits'}` : `访问 ${number} 次`;
    });
    document.querySelectorAll<HTMLElement>('[data-article-views]').forEach((element) => {
      const number = snapshot?.article ? count(snapshot.article.views) : unavailable ? '—' : '…';
      element.textContent = en ? `${number} ${snapshot?.article?.views === 1 ? 'view' : 'views'}` : `浏览 ${number} 次`;
    });
    document.querySelectorAll<HTMLElement>('[data-metrics-status]').forEach((element) => {
      element.hidden = !unavailable;
      element.textContent = en ? 'Statistics unavailable. Try again.' : '统计暂时不可用，请重试。';
    });
  }
  async function request(action: string, extra: Record<string, unknown> = {}) {
    const response = await fetcher('/api/preview-metrics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ action, visitorId, sessionId, slug, ...extra }),
    });
    if (!response.ok) throw new Error('Metrics request failed');
    const value = await response.json() as MetricSnapshot;
    if (!value?.site || typeof value.site.visits !== 'number' || typeof value.site.likes !== 'number' || (slug && !value.article)) throw new Error('Invalid metrics response');
    return value;
  }
  async function refresh(action = visitRecorded ? 'snapshot' : 'visit') {
    try {
      snapshot = await request(action);
      if (action === 'visit') { visitRecorded = true; set(localStorage, 'rumo-preview-metrics-updated', `${Date.now()}_${Math.random()}`); }
      unavailable = false;
    }
    catch { unavailable = true; }
    render();
    return snapshot !== null && !unavailable;
  }
  async function toggle(kind: LikeKind) {
    if (pending || (kind === 'article' && !slug)) return false;
    pending = true; render();
    try {
      if (!snapshot || unavailable) { snapshot = await request(visitRecorded ? 'snapshot' : 'visit'); visitRecorded = true; unavailable = false; }
      const liked = kind === 'site' ? snapshot.site.liked : snapshot.article?.liked;
      snapshot = await request('set-like', { kind, liked: !liked });
      unavailable = false;
      set(localStorage, 'rumo-preview-metrics-updated', `${Date.now()}_${Math.random()}`);
      return true;
    } catch { unavailable = true; return false; }
    finally { pending = false; render(); }
  }
  async function start() {
    try {
      const ready = await refresh('visit');
      if (!ready) return;
      // Carry over the prior single-browser preview likes once, without creating duplicate counts.
      const migrationKey = 'rumo-preview-site-like-migrated';
      if (!get(localStorage, migrationKey)) {
        try {
          if (get(localStorage, 'rumo-preview-liked') === 'yes' && !snapshot?.site.liked) snapshot = await request('set-like', { kind: 'site', liked: true });
          set(localStorage, migrationKey, 'yes');
        } catch { unavailable = true; }
      }
      if (slug) {
        const articleKey = `rumo-preview-article-like-migrated:${slug}`;
        const legacy = `rumo-preview-article-liked:${window.location.pathname}`;
        if (!get(localStorage, articleKey)) {
          try {
            if (get(localStorage, legacy) === 'yes' && !snapshot?.article?.liked) snapshot = await request('set-like', { kind: 'article', liked: true });
            set(localStorage, articleKey, 'yes');
          } catch { unavailable = true; }
        }
      }
    } finally { pending = false; render(); }
  }
  const refreshCurrent = () => refresh(visitRecorded ? 'snapshot' : 'visit');
  window.addEventListener('storage', (event) => { if (event.key === 'rumo-preview-metrics-updated' && !pending) void refreshCurrent(); }, { signal: controller.signal });
  window.addEventListener('focus', () => { if (!pending) void refreshCurrent(); }, { signal: controller.signal });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !pending) void refreshCurrent(); }, { signal: controller.signal });
  render();
  void start();
  return { render, refresh, toggle, getSnapshot: () => snapshot, dispose: () => controller.abort() };
}
