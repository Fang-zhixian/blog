import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initNavigation } from './navigation';

function mediaQuery(matches = false) {
  const query = new EventTarget() as MediaQueryList;
  Object.defineProperty(query, 'matches', { value: matches, writable: true });
  return query;
}

describe('mobile navigation', () => {
  let menu: HTMLDetailsElement;
  let summary: HTMLElement;
  let panel: HTMLElement;
  let desktop: MediaQueryList;
  let reducedMotion: MediaQueryList;
  let animations: Animation[];
  let dispose: ReturnType<typeof initNavigation>;

  beforeEach(() => {
    document.body.innerHTML = `<nav id="site-nav">
      <button data-search-open>搜索</button><button data-theme-toggle>主题</button>
      <details id="mobile-nav"><summary>菜单</summary>
        <div class="mobile-nav-panel"><a href="/blog">文章</a></div>
      </details></nav><button data-outside>正文按钮</button><a data-article href="/blog/article">文章链接</a>`;
    menu = document.querySelector('details')!;
    summary = menu.querySelector('summary')!;
    panel = menu.querySelector('.mobile-nav-panel')!;
    desktop = mediaQuery();
    reducedMotion = mediaQuery();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => query.includes('min-width') ? desktop : reducedMotion));
    animations = [];
    panel.animate = vi.fn(() => {
      const animation = { onfinish: null, oncancel: null, cancel: vi.fn() } as unknown as Animation;
      animations.push(animation);
      return animation;
    });
  });

  afterEach(() => {
    dispose?.();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  const finish = (animation = animations.at(-1)!) => animation.onfinish?.call(animation, {} as AnimationPlaybackEvent);
  const open = () => { summary.click(); finish(); };

  it('animates both directions and makes closing links inert until the last frame', () => {
    dispose = initNavigation();
    summary.click();
    expect(menu.open).toBe(true);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    finish();
    summary.click();
    expect(menu.open).toBe(true);
    expect(summary).toHaveAttribute('aria-label', '打开菜单');
    expect(panel).toHaveAttribute('inert');
    expect(panel.style.pointerEvents).toBe('none');
    finish();
    expect(menu.open).toBe(false);
    expect(panel).not.toHaveAttribute('inert');
    expect(panel.style.pointerEvents).toBe('');
  });

  it('reverses from the current visible frame and ignores stale animation completion', () => {
    dispose = initNavigation();
    open();
    summary.click();
    const closing = animations.at(-1)!;
    const staleFinish = closing.onfinish!;
    const computed = window.getComputedStyle(panel);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ ...computed, opacity: '0.4', transform: 'matrix(1, 0, 0, 1, 0, -3)' } as CSSStyleDeclaration);
    summary.click();
    expect(closing.cancel).toHaveBeenCalled();
    expect(panel.animate).toHaveBeenLastCalledWith([
      { opacity: '0.4', transform: 'matrix(1, 0, 0, 1, 0, -3)' },
      { opacity: '1', transform: 'translateY(0)' },
    ], expect.objectContaining({ duration: 160, fill: 'both' }));
    staleFinish.call(closing, {} as AnimationPlaybackEvent);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    finish();
    expect(menu.open).toBe(true);
    expect(panel).not.toHaveAttribute('inert');
  });

  it('dismisses on outside pointer or keyboard activation without taking outside focus', () => {
    dispose = initNavigation();
    open();
    const outside = document.querySelector<HTMLButtonElement>('[data-outside]')!;
    outside.focus();
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    finish();
    expect(menu.open).toBe(false);
    expect(outside).toHaveFocus();
    open();
    outside.click();
    finish();
    expect(menu.open).toBe(false);
  });

  it('returns focus to the menu button when Escape closes it', () => {
    dispose = initNavigation();
    open();
    menu.querySelector('a')!.focus();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(summary).toHaveFocus();
    finish();
    expect(menu.open).toBe(false);
  });

  it('hands off to search or other toolbar controls immediately without a residual panel', () => {
    dispose = initNavigation();
    summary.click();
    document.dispatchEvent(new Event('site:search-open'));
    expect(menu.open).toBe(false);
    expect(animations[0].cancel).toHaveBeenCalled();
    open();
    document.querySelector('[data-theme-toggle]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(menu.open).toBe(false);
    open();
    document.querySelector<HTMLButtonElement>('[data-search-open]')!.click();
    expect(menu.open).toBe(false);
  });

  it('closes for same-tab navigation while preserving modified clicks', () => {
    dispose = initNavigation();
    open();
    const link = menu.querySelector('a')!;
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(menu.open).toBe(true);
    // Prevent JSDOM navigation after the menu has handled the ordinary click.
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.click();
    expect(menu.open).toBe(false);
  });

  it('finishes an outside-dismissal animation before an article link navigates', () => {
    dispose = initNavigation();
    open();
    const link = document.querySelector<HTMLAnchorElement>('[data-article]')!;
    link.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(menu.open).toBe(true);
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.click();
    expect(menu.open).toBe(false);
  });

  it('closes before page caching and desktop layout, retaining handlers after restore', () => {
    dispose = initNavigation();
    open();
    window.dispatchEvent(new Event('pagehide'));
    expect(menu.open).toBe(false);
    window.dispatchEvent(new Event('pageshow'));
    open();
    expect(menu.open).toBe(true);
    Object.defineProperty(desktop, 'matches', { value: true });
    desktop.dispatchEvent(new Event('change'));
    expect(menu.open).toBe(false);
  });

  it('settles immediately for reduced motion and falls back when animations are unavailable', () => {
    Object.defineProperty(reducedMotion, 'matches', { value: true });
    dispose = initNavigation();
    summary.click();
    expect(menu.open).toBe(true);
    expect(panel.animate).not.toHaveBeenCalled();
    summary.click();
    expect(menu.open).toBe(false);
    Object.defineProperty(reducedMotion, 'matches', { value: false });
    panel.animate = undefined as unknown as typeof panel.animate;
    summary.click();
    expect(menu.open).toBe(true);
  });

  it('cleans up an in-progress animation and restores preexisting panel styles', () => {
    panel.style.pointerEvents = 'auto';
    dispose = initNavigation();
    open();
    summary.click();
    dispose?.();
    expect(menu.open).toBe(false);
    expect(panel.style.pointerEvents).toBe('auto');
    expect(panel).not.toHaveAttribute('inert');
    expect(menu).not.toHaveAttribute('data-ready');
    menu.open = true;
    document.dispatchEvent(new Event('site:search-open'));
    expect(menu.open).toBe(true);
    dispose = undefined;
  });
});
