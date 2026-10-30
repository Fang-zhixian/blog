import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initArticleImages, largestImageSource } from './article-images';

const markup = readFileSync('src/components/ArticleImages.astro', 'utf8').split('<script>')[0];

describe('article image viewer', () => {
  let dialog: HTMLDialogElement;
  let image: HTMLImageElement;
  let fullImage: HTMLImageElement;
  let stage: HTMLElement;
  let dispose: ReturnType<typeof initArticleImages>;
  const trigger = () => image.closest<HTMLButtonElement>('button')!;
  const zoom = () => dialog.querySelector<HTMLButtonElement>('[data-image-zoom]')!;
  const closeButton = () => dialog.querySelector<HTMLButtonElement>('[data-image-close]')!;

  beforeEach(() => {
    document.body.innerHTML = `<article data-post-content><p>原文不变</p><p><img src="/large.webp" srcset="/small.webp 640w, /large.webp 1960w, /medium.webp 1024w" width="1960" height="980" alt="桌面软件截图"></p><p><a href="/original.png"><img src="/linked.png" alt="已有链接"></a></p></article>${markup}`;
    dialog = document.querySelector('dialog')!;
    image = document.querySelector('[data-post-content] img')!;
    fullImage = dialog.querySelector('[data-image-full]')!;
    stage = dialog.querySelector('[data-image-stage]')!;
    Object.defineProperties(stage, { clientWidth: { configurable: true, value: 320 }, clientHeight: { configurable: true, value: 480 } });
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event('close')); };
  });
  afterEach(() => {
    dispose?.();
    vi.restoreAllMocks();
    delete document.documentElement.dataset.lang;
    document.body.replaceChildren();
  });

  it('updates image controls when the interface switches to English', () => {
    dispose = initArticleImages();
    document.documentElement.dataset.lang = 'en';
    document.dispatchEvent(new Event('preview:language-changed'));
    expect(trigger()).toHaveAttribute('aria-label', 'Enlarge image: 桌面软件截图');
    trigger().click();
    expect(zoom()).toHaveTextContent('Zoom in');
    zoom().click();
    expect(zoom()).toHaveTextContent('Zoom out');
  });

  it('enhances unlinked images without changing their responsive attributes or article text', () => {
    const beforeText = document.querySelector('article')!.textContent;
    const srcset = image.srcset;
    dispose = initArticleImages();
    expect(document.querySelector('article')!.textContent).toBe(beforeText);
    expect(trigger()).toHaveAttribute('aria-label', '放大图片：桌面软件截图');
    expect(image.srcset).toBe(srcset);
    expect(image.getAttribute('src')).toBe('/large.webp');
    expect(document.querySelector('a img')!.parentElement?.tagName).toBe('A');
    expect(initArticleImages()).toBeUndefined();
    expect(document.querySelectorAll('.article-image-trigger')).toHaveLength(1);
  });

  it('uses the largest source and preserves the image ratio when fitting and zooming', () => {
    dispose = initArticleImages();
    const handoff = vi.fn();
    document.addEventListener('site:image-open', handoff, { once: true });
    trigger().click();
    expect(handoff).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(fullImage.getAttribute('src')).toBe('/large.webp');
    expect(fullImage.alt).toBe(image.alt);
    expect(fullImage.style.width).toBe('320px');
    expect(fullImage.style.height).toBe('160px');
    expect(closeButton()).toHaveFocus();
    zoom().click();
    expect(fullImage.style.width).toBe('1960px');
    expect(fullImage.style.height).toBe('980px');
    expect(zoom()).toHaveAttribute('aria-pressed', 'true');
    expect(zoom()).toHaveTextContent('缩小');
    stage.scrollTop = 50;
    zoom().click();
    expect(fullImage.style.width).toBe('320px');
    expect(stage.scrollTop).toBe(0);
  });

  it('fits tall images by height and recalculates after orientation changes', () => {
    image.removeAttribute('srcset');
    image.width = 390;
    image.height = 844;
    dispose = initArticleImages();
    trigger().click();
    expect(fullImage.style.width).toBe('222px');
    expect(fullImage.style.height).toBe('480px');
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 240 });
    window.dispatchEvent(new Event('resize'));
    expect(fullImage.style.height).toBe('240px');
    expect(fullImage.style.width).toBe('111px');
  });

  it('closes with Escape or the background and restores focus without scrolling', () => {
    dispose = initArticleImages();
    trigger().focus();
    trigger().click();
    const focus = vi.spyOn(trigger(), 'focus');
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    trigger().click();
    fullImage.click();
    expect(dialog.open).toBe(true);
    stage.click();
    expect(dialog.open).toBe(false);
  });

  it('hands off to search or contents without stealing focus and cleans up before history restoration', () => {
    dispose = initArticleImages();
    const focus = vi.spyOn(trigger(), 'focus');
    for (const name of ['site:search-open', 'site:toc-open']) {
      trigger().click();
      document.dispatchEvent(new Event(name));
      expect(dialog.open).toBe(false);
      expect(dialog).toHaveAttribute('data-navigation-closing', 'true');
    }
    expect(focus).not.toHaveBeenCalled();
    trigger().click();
    expect(dialog).not.toHaveAttribute('data-navigation-closing');
    window.dispatchEvent(new Event('pagehide'));
    expect(dialog.open).toBe(false);
    trigger().click();
    expect(dialog.open).toBe(true);
  });

  it('updates intrinsic dimensions on load and falls back after a large image fails', () => {
    image.src = '/fallback.webp';
    dispose = initArticleImages();
    trigger().click();
    fullImage.dispatchEvent(new Event('error'));
    expect(fullImage.src).toBe(image.src);
    Object.defineProperties(fullImage, { naturalWidth: { value: 640 }, naturalHeight: { value: 320 } });
    fullImage.dispatchEvent(new Event('load'));
    zoom().click();
    expect(fullImage.style.width).toBe('640px');
    fullImage.dispatchEvent(new Event('error'));
    expect(dialog.querySelector('[role=status]')).toHaveTextContent('图片暂时无法加载');
  });

  it('removes enhancements on disposal and leaves originals usable without dialog support', () => {
    dispose = initArticleImages();
    trigger().click();
    dispose?.();
    dispose = undefined;
    expect(dialog.open).toBe(false);
    expect(image.parentElement?.tagName).toBe('P');
    expect(image.getAttribute('src')).toBe('/large.webp');
    expect(document.querySelectorAll('.article-image-trigger')).toHaveLength(0);
    Object.defineProperty(dialog, 'showModal', { value: undefined });
    expect(initArticleImages()).toBeUndefined();
    expect(image.parentElement?.tagName).toBe('P');
  });

  it('supports density sources and images without a srcset', () => {
    image.width = 400;
    image.srcset = '/one.webp 1x, /two.webp 2x';
    expect(largestImageSource(image)).toEqual({ src: '/two.webp', width: 800 });
    image.srcset = '';
    expect(largestImageSource(image)).toEqual({ src: image.src, width: 400 });
  });
});
