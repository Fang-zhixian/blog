import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initRumoPreview } from './rumo-preview';

describe('local Rumo-style preview', () => {
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    document.documentElement.className = 'terminal-active';
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn() })));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    Element.prototype.scrollIntoView = vi.fn();
    let siteLiked = false; let articleLiked = false;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(String(options.body));
      if (body.action === 'set-like' && body.kind === 'site') siteLiked = body.liked;
      if (body.action === 'set-like' && body.kind === 'article') articleLiked = body.liked;
      return { ok: true, json: async () => ({ site: { visits: 1, likes: Number(siteLiked), liked: siteLiked }, article: { views: 1, likes: Number(articleLiked), liked: articleLiked } }) };
    }));
    document.body.innerHTML = `
      <section data-terminal data-terminal-posts='[{"slug":"example","title":"真实文章"}]'>
        <div data-terminal-output></div><form data-terminal-form><input data-terminal-input></form>
        <button data-tty-theme="auto">跟随</button><button data-tty-theme="dark">深色终端</button><button data-tty-theme="light">浅色终端</button>
        <button data-terminal-enter>进入</button><button data-terminal-command="latest">latest</button>
        <button data-like-site><span data-like-label></span><span data-like-count></span></button>
      </section>
      <div class="rumo-shell"><main id="main-content" tabindex="-1" data-article-slug="example"></main>
        <span data-site-visits></span><span data-article-views></span>
        <button data-like-article><span data-like-label></span><span data-like-count></span></button>
        <button data-back-top-inline>回到顶部</button>
        <button data-terminal-open>打开终端</button>
        <button data-theme-mode="dark">dark</button><button data-theme-mode="light">light</button><button data-lang-switch="en">English</button>
        <span data-zh="博客" data-en="Blog">博客</span>
        <div data-filter-root><button data-content-filter="all">全部</button><button data-content-filter="en">English</button>
          <a data-content-language="zh">文章</a><p data-filter-empty hidden>没有内容</p></div>
      </div>`;
    initRumoPreview();
  });
  afterEach(() => {
    document.body.replaceChildren(); document.documentElement.className = ''; delete document.documentElement.dataset.lang;
    localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
  it('connects terminal, language, persistent metrics and filters', async () => {
    await vi.waitFor(() => expect(document.querySelector('[data-site-visits]')).toHaveTextContent('访问 1 次'));
    document.querySelector<HTMLButtonElement>('[data-terminal-command]')!.click();
    expect(document.querySelector('[data-terminal-output]')).toHaveTextContent('真实文章');
    document.querySelector<HTMLButtonElement>('[data-like-site]')!.click();
    await vi.waitFor(() => expect(document.querySelector('[data-like-site]')).toHaveAttribute('aria-pressed', 'true'));
    document.querySelector<HTMLButtonElement>('[data-like-article]')!.click();
    await vi.waitFor(() => expect(document.querySelector('[data-like-article]')).toHaveAttribute('aria-pressed', 'true'));
    expect(document.querySelector('[data-article-views]')).toHaveTextContent('浏览 1 次');
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.querySelector<HTMLButtonElement>('[data-back-top-inline]')!.click();
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    document.querySelector<HTMLButtonElement>('[data-terminal-enter]')!.click();
    expect(document.documentElement).not.toHaveClass('terminal-active');
    expect(sessionStorage.getItem('rumo-preview-entered')).toBe('yes');
    document.querySelector<HTMLButtonElement>('button[data-theme-mode]')!.click();
    expect(document.documentElement).toHaveClass('dark');
    document.querySelector<HTMLButtonElement>('[data-lang-switch]')!.click();
    expect(document.querySelector('[data-zh="博客"]')).toHaveTextContent('Blog');
    expect(document.querySelector('[data-site-visits]')).toHaveTextContent('1 visit');
    document.querySelector<HTMLButtonElement>('[data-content-filter="en"]')!.click();
    expect(document.querySelector('[data-content-language]')).toHaveAttribute('hidden');
    expect(document.querySelector('[data-filter-empty]')).not.toHaveAttribute('hidden');
  });
  it('follows the document by default and remembers manual terminal choices', () => {
    const terminal = document.querySelector<HTMLElement>('[data-terminal]')!;
    const follow = document.querySelector<HTMLButtonElement>('[data-tty-theme="auto"]')!;
    const ttyLight = document.querySelector<HTMLButtonElement>('[data-tty-theme="light"]')!;
    const docDark = document.querySelector<HTMLButtonElement>('[data-theme-mode="dark"]')!;
    const docLight = document.querySelector<HTMLButtonElement>('[data-theme-mode="light"]')!;
    expect(terminal).toHaveClass('terminal-light');
    expect(follow).toHaveAttribute('aria-pressed', 'true');
    docDark.click();
    expect(terminal).not.toHaveClass('terminal-light');
    ttyLight.click();
    expect(localStorage.getItem('rumo-preview-tty-mode')).toBe('light');
    docLight.click(); docDark.click();
    expect(terminal).toHaveClass('terminal-light');
    follow.click();
    expect(localStorage.getItem('rumo-preview-tty-mode')).toBe('auto');
    expect(terminal).not.toHaveClass('terminal-light');
  });
  it('opens the mobile terminal at its entry controls without focusing the command input', () => {
    const enter = document.querySelector<HTMLButtonElement>('[data-terminal-enter]')!;
    enter.click();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query === '(max-width: 600px)', addEventListener: vi.fn() })));
    document.querySelector<HTMLButtonElement>('[data-terminal-open]')!.click();
    expect(enter).toHaveFocus();
    expect(document.querySelector('[data-terminal-input]')).not.toHaveFocus();
  });
});
