import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initThemeToggle } from './theme';

describe('theme transition', () => {
  let dispose: ReturnType<typeof initThemeToggle>;
  beforeEach(() => {
    document.body.innerHTML = '<button data-theme-toggle>主题</button>';
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  });
  afterEach(() => {
    dispose?.();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (document as Partial<Document>).startViewTransition;
    document.documentElement.classList.remove('dark');
    document.body.replaceChildren();
    localStorage.clear();
  });
  const button = () => document.querySelector<HTMLButtonElement>('button')!;

  it('switches immediately when native transitions are unavailable', () => {
    dispose = initThemeToggle();
    button().click();
    expect(document.documentElement).toHaveClass('dark');
    expect(button()).toHaveAttribute('aria-label', '切换为浅色模式');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('honors reduced motion and works when local storage fails', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const start = vi.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    dispose = initThemeToggle();
    button().click();
    expect(document.documentElement).toHaveClass('dark');
    expect(button()).toHaveAttribute('aria-label', '切换为浅色模式');
    expect(start).not.toHaveBeenCalled();
  });

  it('keeps the last requested theme during rapid repeated clicks', async () => {
    const callbacks: (() => void)[] = [];
    const skipTransition = vi.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: vi.fn((callback) => {
      callbacks.push(callback);
      return { finished: Promise.resolve(), skipTransition };
    }) });
    dispose = initThemeToggle();
    button().click();
    button().click();
    callbacks[1]();
    callbacks[0]();
    await Promise.resolve();
    expect(skipTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement).not.toHaveAttribute('data-theme-transition');
  });

  it('resynchronizes a restored history page with the saved theme', () => {
    dispose = initThemeToggle();
    localStorage.setItem('theme', 'dark');
    window.dispatchEvent(new Event('pageshow'));
    expect(document.documentElement).toHaveClass('dark');
    expect(button()).toHaveAttribute('aria-label', '切换为浅色模式');
  });
});
