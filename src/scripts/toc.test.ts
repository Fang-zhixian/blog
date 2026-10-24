import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initToc } from './toc';

const rect = (top: number, bottom: number, left = 0, right = 360) => ({ top, bottom, left, right, height: bottom - top, width: right - left }) as DOMRect;

describe('article table of contents', () => {
  let dialog: HTMLDialogElement;
  let button: HTMLButtonElement;
  let list: HTMLElement;
  let headings: HTMLElement[];
  let positions: number[];
  let frames: Map<number, FrameRequestCallback>;
  let frameId: number;
  let desktop: EventTarget & { matches: boolean };
  let dispose: ReturnType<typeof initToc>;
  const links = () => Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-id]'));
  const mobileLink = (id: string) => dialog.querySelector<HTMLAnchorElement>(`[data-toc-id="${id}"]`)!;
  const flushFrame = () => {
    const queued = [...frames.values()];
    frames.clear();
    queued.forEach((callback) => callback(0));
  };

  beforeEach(() => {
    const items = ['first', 'long', 'last'].map((id) => `<li><a data-toc-id="${id}" href="#${id}">${id}</a></li>`).join('');
    document.body.innerHTML = `<nav data-toc><ol>${items}</ol></nav>
      <button data-toc-open>目录</button><dialog data-toc-dialog><button data-toc-close>关闭</button>
      <div data-toc-list><ol>${items}</ol></div></dialog>
      <main><h2 id="first">first</h2><h2 id="long">long section</h2><h2 id="last">last</h2></main>`;
    dialog = document.querySelector('dialog')!;
    button = document.querySelector('[data-toc-open]')!;
    list = document.querySelector('[data-toc-list]')!;
    headings = Array.from(document.querySelectorAll('h2'));
    positions = [240, 1500, 5000];
    headings.forEach((heading, index) => {
      heading.style.scrollMarginTop = '112px';
      vi.spyOn(heading, 'getBoundingClientRect').mockImplementation(() => rect(positions[index], positions[index] + 30));
    });
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(rect(300, 800));
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(rect(370, 760));
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 390 });
    dialog.showModal = vi.fn(() => {
      dialog.open = true;
      dialog.querySelector<HTMLButtonElement>('button')!.focus();
    });
    dialog.close = vi.fn(() => {
      dialog.open = false;
      button.focus({ preventScroll: true });
      dialog.dispatchEvent(new Event('close'));
    });
    desktop = Object.assign(new window.EventTarget(), { matches: false });
    vi.stubGlobal('matchMedia', vi.fn(() => desktop));
    frames = new Map();
    frameId = 0;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('tracks the reading edge inside long sections and coalesces scroll work into a frame', () => {
    dispose = initToc();
    expect(links().filter((link) => link.getAttribute('aria-current') === 'location')).toHaveLength(2);
    expect(mobileLink('first')).toHaveAttribute('aria-current', 'location');
    positions = [-1600, -340, 3160];
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(frames.size).toBe(1);
    flushFrame();
    expect(mobileLink('long')).toHaveAttribute('aria-current', 'location');
    expect(mobileLink('first')).not.toHaveAttribute('aria-current');
    positions = [-4600, -3340, 110];
    window.dispatchEvent(new Event('scroll'));
    flushFrame();
    expect(mobileLink('last')).toHaveAttribute('aria-current', 'location');
  });

  it('reveals the current entry within the sheet without scrolling the article', () => {
    positions = [-1600, -340, 3160];
    vi.spyOn(mobileLink('long'), 'getBoundingClientRect').mockReturnValue(rect(860, 904));
    const pageScroll = vi.spyOn(window, 'scrollTo');
    dispose = initToc();
    button.click();
    expect(dialog.open).toBe(true);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(list.scrollTop).toBe(317);
    expect(pageScroll).not.toHaveBeenCalled();
    dialog.querySelector<HTMLButtonElement>('[data-toc-close]')!.click();
    expect(dialog.open).toBe(false);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(button);
  });

  it('closes only on the backdrop, keeping touches inside sheet padding safe', () => {
    dispose = initToc();
    button.click();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 350 }));
    expect(dialog.open).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 200 }));
    expect(dialog.open).toBe(false);
  });

  it('keeps native anchor navigation and moves keyboard focus to the selected heading', () => {
    dispose = initToc();
    button.click();
    const link = mobileLink('long');
    let preventedByToc = true;
    link.addEventListener('click', (event) => {
      preventedByToc = event.defaultPrevented;
      event.preventDefault(); // Prevent jsdom's asynchronous navigation; the directory does not intercept it.
    }, { once: true });
    link.click();
    expect(preventedByToc).toBe(false);
    expect(link.getAttribute('href')).toBe('#long');
    expect(dialog.open).toBe(false);
    expect(dialog).toHaveAttribute('data-navigation-closing', 'true');
    expect(document.activeElement).toBe(headings[1]);
    expect(headings[1]).toHaveAttribute('tabindex', '-1');
    button.focus();
    expect(headings[1]).not.toHaveAttribute('tabindex');
  });

  it('preserves an authored heading tabindex and modified-click behavior', () => {
    headings[1].setAttribute('tabindex', '0');
    dispose = initToc();
    button.click();
    const link = mobileLink('long');
    link.addEventListener('click', (event) => event.preventDefault());
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }));
    expect(dialog.open).toBe(true);
    expect(headings[1]).toHaveAttribute('tabindex', '0');
    link.click();
    expect(headings[1]).toHaveAttribute('tabindex', '-1');
    button.focus();
    expect(headings[1]).toHaveAttribute('tabindex', '0');
  });

  it.each(['site:search-open', 'site:image-open'])('hands off to %s without leaving a closing overlay', (eventName) => {
    const openEvent = vi.fn();
    document.addEventListener('site:toc-open', openEvent, { once: true });
    dispose = initToc();
    button.click();
    expect(openEvent).toHaveBeenCalledOnce();
    document.dispatchEvent(new Event(eventName));
    expect(dialog.open).toBe(false);
    expect(dialog).toHaveAttribute('data-navigation-closing', 'true');
    button.click();
    expect(dialog.open).toBe(true);
    expect(dialog).not.toHaveAttribute('data-navigation-closing');
  });

  it('closes at the desktop breakpoint and remains usable after a BFCache restore', () => {
    dispose = initToc();
    button.click();
    desktop.matches = true;
    desktop.dispatchEvent(new Event('change'));
    expect(dialog.open).toBe(false);
    button.click();
    expect(dialog.open).toBe(false);
    desktop.matches = false;
    desktop.dispatchEvent(new Event('change'));
    button.click();
    window.dispatchEvent(new Event('pagehide'));
    expect(dialog.open).toBe(false);
    expect(frames.size).toBe(0);
    positions = [-1600, -340, 3160];
    window.dispatchEvent(new Event('pageshow'));
    flushFrame();
    expect(mobileLink('long')).toHaveAttribute('aria-current', 'location');
    button.click();
    expect(dialog.open).toBe(true);
  });

  it('avoids duplicate listeners and cancels scheduled work on cleanup', () => {
    dispose = initToc();
    expect(initToc()).toBeUndefined();
    button.click();
    expect(dialog.showModal).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('scroll'));
    dispose?.();
    dispose = undefined;
    expect(frames.size).toBe(0);
    expect(button).not.toHaveAttribute('data-ready');
    button.click();
    expect(dialog.open).toBe(false);
    expect(dialog.showModal).toHaveBeenCalledOnce();
  });
});
