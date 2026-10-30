import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPreviewMetrics } from './preview-metrics';

describe('preview metrics UI', () => {
  let dispose: (() => void) | undefined;
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    document.body.innerHTML = '<span data-site-visits></span><span data-metrics-status hidden></span><button data-like-site><span data-like-label></span><span data-like-count></span></button>';
  });
  afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });
  it('shows unavailable data without inventing counts when the backend fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const metrics = initPreviewMetrics({ getLanguage: () => 'en', fetcher }); dispose = metrics.dispose;
    await vi.waitFor(() => expect(document.querySelector('[data-metrics-status]')).not.toHaveAttribute('hidden'));
    expect(document.querySelector('[data-site-visits]')).toHaveTextContent('— visits');
    expect(document.querySelector('[data-like-count]')).toHaveTextContent('—');
    expect(await metrics.toggle('site')).toBe(false);
    expect(document.querySelector('[data-like-site]')).toHaveAttribute('aria-pressed', 'false');
  });
  it('retries the visit when the local service becomes available', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ ok: true, json: async () => ({ site: { visits: 1, likes: 0, liked: false }, article: null }) });
    const metrics = initPreviewMetrics({ getLanguage: () => 'zh', fetcher: fetcher as unknown as typeof fetch }); dispose = metrics.dispose;
    await vi.waitFor(() => expect(document.querySelector('[data-metrics-status]')).not.toHaveAttribute('hidden'));
    expect(await metrics.refresh()).toBe(true);
    const retry = JSON.parse(String(fetcher.mock.calls[1][1].body));
    expect(retry.action).toBe('visit');
    expect(document.querySelector('[data-site-visits]')).toHaveTextContent('访问 1 次');
  });
  it('migrates a previous local like once and respects a later unlike', async () => {
    localStorage.setItem('rumo-preview-liked', 'yes');
    let liked = false;
    const fetcher = vi.fn(async (_url: string, options: RequestInit) => {
      const request = JSON.parse(String(options.body));
      if (request.action === 'set-like') liked = request.liked;
      return { ok: true, json: async () => ({ site: { visits: 1, likes: Number(liked), liked }, article: null }) };
    }) as unknown as typeof fetch;
    let metrics = initPreviewMetrics({ getLanguage: () => 'zh', fetcher }); dispose = metrics.dispose;
    await vi.waitFor(() => expect(document.querySelector('[data-like-site]')).toHaveAttribute('aria-pressed', 'true'));
    expect(localStorage.getItem('rumo-preview-site-like-migrated')).toBe('yes');
    expect(await metrics.toggle('site')).toBe(true);
    expect(document.querySelector('[data-like-site]')).toHaveAttribute('aria-pressed', 'false');
    metrics.dispose();
    metrics = initPreviewMetrics({ getLanguage: () => 'zh', fetcher }); dispose = metrics.dispose;
    await vi.waitFor(() => expect(document.querySelector('[data-like-site]')).not.toBeDisabled());
    expect(document.querySelector('[data-like-site]')).toHaveAttribute('aria-pressed', 'false');
    expect(liked).toBe(false);
  });
});
