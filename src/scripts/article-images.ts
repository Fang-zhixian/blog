/** Astro's responsive srcset contains width descriptors; retain a density fallback for other images. */
export function largestImageSource(image: HTMLImageElement) {
  const baseWidth = image.naturalWidth || Number(image.getAttribute('width')) || 0;
  const candidates = image.srcset.split(',').map((candidate) => {
    const match = candidate.trim().match(/^(\S+)\s+([\d.]+)(w|x)$/);
    if (!match) return null;
    return { src: match[1], width: Number(match[2]) * (match[3] === 'x' ? baseWidth || 1 : 1) };
  }).filter((candidate): candidate is { src: string; width: number } => Boolean(candidate));
  candidates.sort((a, b) => b.width - a.width);
  return candidates[0] ?? { src: image.currentSrc || image.src, width: baseWidth };
}

export function initArticleImages(
  article = document.querySelector<HTMLElement>('[data-post-content]'),
  dialog = document.querySelector<HTMLDialogElement>('[data-image-dialog]'),
) {
  const fullImage = dialog?.querySelector<HTMLImageElement>('[data-image-full]');
  const stage = dialog?.querySelector<HTMLElement>('[data-image-stage]');
  const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-image-close]');
  const zoomButton = dialog?.querySelector<HTMLButtonElement>('[data-image-zoom]');
  const status = dialog?.querySelector<HTMLElement>('[data-image-status]');
  if (!article || !dialog || !fullImage || !stage || !closeButton || !zoomButton || !status || dialog.dataset.ready || typeof dialog.showModal !== 'function') return;

  dialog.dataset.ready = 'true';
  const controller = new window.AbortController();
  const { signal } = controller;
  const wrappers: HTMLButtonElement[] = [];
  let activeTrigger: HTMLButtonElement | null = null;
  let restoreFocus = true;
  let zoomed = false;
  let sourceWidth = 0;
  let sourceHeight = 0;
  let fallbackSource = '';
  const uiText = (zh: string, en: string) => document.documentElement.dataset.lang === 'en' ? en : zh;

  const sizeImage = () => {
    if (!dialog.open || !sourceWidth || !sourceHeight) return;
    const width = stage.clientWidth || window.innerWidth;
    const height = stage.clientHeight || window.innerHeight;
    const scale = zoomed ? 1 : Math.min(1, width / sourceWidth, height / sourceHeight);
    fullImage.style.width = `${Math.round(sourceWidth * scale)}px`;
    fullImage.style.height = `${Math.round(sourceHeight * scale)}px`;
  };
  const syncViewport = () => {
    if (!dialog.open) return;
    dialog.style.setProperty('--image-viewport-height', `${window.visualViewport?.height || window.innerHeight}px`);
    dialog.style.setProperty('--image-viewport-top', `${Math.max(0, window.visualViewport?.offsetTop || 0)}px`);
    sizeImage();
  };
  const setZoom = (value: boolean) => {
    zoomed = value;
    dialog.dataset.zoomed = String(value);
    zoomButton.setAttribute('aria-pressed', String(value));
    zoomButton.textContent = value ? uiText('缩小', 'Zoom out') : uiText('放大', 'Zoom in');
    status.textContent = value ? uiText('滑动图片查看细节', 'Scroll to explore the image') : uiText('点按放大查看细节', 'Zoom in to see details');
    sizeImage();
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  };
  const finishClose = () => {
    if (dialog.open) return;
    const trigger = activeTrigger;
    activeTrigger = null;
    trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
  };
  const close = (focus = true, immediate = false) => {
    restoreFocus = focus;
    if (immediate) dialog.dataset.navigationClosing = 'true';
    if (dialog.open) dialog.close();
    finishClose();
  };

  for (const thumbnail of article.querySelectorAll<HTMLImageElement>('img')) {
    if (thumbnail.closest('a, button')) continue;
    const wrapper = document.createElement('button');
    wrapper.type = 'button';
    wrapper.className = 'article-image-trigger';
    const updateLabel = () => wrapper.setAttribute('aria-label', thumbnail.alt ? uiText(`放大图片：${thumbnail.alt}`, `Enlarge image: ${thumbnail.alt}`) : uiText('放大文章图片', 'Enlarge article image'));
    updateLabel();
    document.addEventListener('preview:language-changed', updateLabel, { signal });
    wrapper.setAttribute('aria-haspopup', 'dialog');
    wrapper.setAttribute('aria-expanded', 'false');
    thumbnail.before(wrapper);
    wrapper.append(thumbnail);
    wrappers.push(wrapper);
    wrapper.addEventListener('click', () => {
      document.dispatchEvent(new Event('site:image-open'));
      activeTrigger = wrapper;
      restoreFocus = true;
      wrapper.setAttribute('aria-expanded', 'true');
      delete dialog.dataset.navigationClosing;
      const source = largestImageSource(thumbnail);
      const originalWidth = Number(thumbnail.getAttribute('width')) || thumbnail.naturalWidth || source.width;
      const originalHeight = Number(thumbnail.getAttribute('height')) || thumbnail.naturalHeight;
      sourceWidth = source.width || originalWidth;
      sourceHeight = originalWidth ? sourceWidth * originalHeight / originalWidth : originalHeight;
      fallbackSource = thumbnail.currentSrc || thumbnail.src;
      fullImage.alt = thumbnail.alt;
      fullImage.src = source.src;
      dialog.showModal();
      syncViewport();
      setZoom(false);
      closeButton.focus({ preventScroll: true });
    }, { signal });
  }

  fullImage.addEventListener('load', () => {
    if (fullImage.naturalWidth && fullImage.naturalHeight) {
      sourceWidth = fullImage.naturalWidth;
      sourceHeight = fullImage.naturalHeight;
    }
    sizeImage();
  }, { signal });
  fullImage.addEventListener('error', () => {
    if (fallbackSource && fullImage.src !== fallbackSource) fullImage.src = fallbackSource;
    else status.textContent = uiText('图片暂时无法加载，请关闭后重试', 'Image unavailable. Close and try again.');
  }, { signal });
  zoomButton.addEventListener('click', () => setZoom(!zoomed), { signal });
  closeButton.addEventListener('click', () => close(), { signal });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); }, { signal });
  dialog.addEventListener('close', finishClose, { signal });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target === stage || (event.target instanceof HTMLElement && event.target.hasAttribute('data-image-canvas'))) close();
  }, { signal });
  document.addEventListener('site:search-open', () => close(false, true), { signal });
  document.addEventListener('site:toc-open', () => close(false, true), { signal });
  document.addEventListener('preview:language-changed', () => setZoom(zoomed), { signal });
  window.addEventListener('pagehide', () => close(false, true), { signal });
  window.addEventListener('resize', syncViewport, { signal });
  window.visualViewport?.addEventListener('resize', syncViewport, { signal });
  window.visualViewport?.addEventListener('scroll', syncViewport, { signal });

  return () => {
    close(false, true);
    controller.abort();
    for (const wrapper of wrappers) wrapper.replaceWith(...wrapper.childNodes);
    fullImage.removeAttribute('src');
    fullImage.removeAttribute('style');
    dialog.style.removeProperty('--image-viewport-height');
    dialog.style.removeProperty('--image-viewport-top');
    delete dialog.dataset.ready;
  };
}
