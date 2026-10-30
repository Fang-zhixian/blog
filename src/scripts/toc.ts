/** Keep section navigation native while managing the mobile directory sheet. */
export function initToc(root: ParentNode = document) {
  const desktopNav = root.querySelector<HTMLElement>('nav[data-toc]');
  const desktopList = desktopNav?.querySelector<HTMLElement>('[data-toc-desktop-list]') ?? desktopNav;
  const openButton = root.querySelector<HTMLButtonElement>('[data-toc-open]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-toc-close]');
  const topButton = root.querySelector<HTMLButtonElement>('[data-toc-top]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-toc-dialog]');
  const list = dialog?.querySelector<HTMLElement>('[data-toc-list]');
  if (!openButton || !dialog || !list || openButton.dataset.ready === 'true') return;

  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-toc] a[data-toc-id], [data-toc-dialog] a[data-toc-id]'));
  const ids = [...new Set(links.map((link) => link.dataset.tocId).filter((id): id is string => Boolean(id)))];
  const headings = ids.map((id) => document.getElementById(id)).filter((heading): heading is HTMLElement => Boolean(heading));
  const controller = new window.AbortController();
  const { signal } = controller;
  const desktop = window.matchMedia?.('(min-width: 1100px)');
  let frame: number | undefined;
  let activeId: string | undefined;
  let restoreHeadingFocus: (() => void) | undefined;
  openButton.dataset.ready = 'true';

  const revealLink = (container: HTMLElement | null | undefined) => {
    if (!container || !activeId) return;
    const link = links.find((item) => item.dataset.tocId === activeId && container.contains(item));
    if (!link) return;
    const bounds = container.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    if (target.top < bounds.top || target.bottom > bounds.bottom) {
      container.scrollTop += target.top - bounds.top - (container.clientHeight - target.height) / 2;
    }
  };
  const updateActive = () => {
    if (!headings.length) return;
    // Track the section at the reading edge, including long sections between headings.
    const readingEdge = Number.parseFloat(window.getComputedStyle(headings[0]).scrollMarginTop) || 128;
    // The introduction is not part of the first section; leave the list unselected until it is reached.
    let current: HTMLElement | undefined;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > readingEdge + 1) break;
      current = heading;
    }
    if (current?.id === activeId) return;
    activeId = current?.id;
    for (const link of links) {
      if (activeId && link.dataset.tocId === activeId) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if (desktop?.matches) revealLink(desktopList);
  };
  const scheduleUpdate = () => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      updateActive();
    });
  };
  const close = (immediate = false) => {
    if (immediate) dialog.dataset.navigationClosing = 'true';
    if (dialog.open) dialog.close();
    openButton.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    if (dialog.open || desktop?.matches) return;
    document.dispatchEvent(new Event('site:toc-open'));
    delete dialog.dataset.navigationClosing;
    updateActive();
    dialog.showModal();
    openButton.setAttribute('aria-expanded', 'true');
    revealLink(list);
  };

  openButton.addEventListener('click', open, { signal });
  closeButton?.addEventListener('click', () => close(), { signal });
  topButton?.addEventListener('click', () => {
    close(true);
    document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, { signal });
  dialog.addEventListener('close', () => {
    openButton.setAttribute('aria-expanded', String(dialog.open));
  }, { signal });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }, { signal });
  for (const link of links) {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const heading = headings.find((item) => item.id === link.dataset.tocId);
      if (!heading) return;
      if (dialog.contains(link)) close(true);
      // Let the anchor perform the hash/history/scroll action, while moving keyboard focus to the section.
      restoreHeadingFocus?.();
      const originalTabindex = heading.getAttribute('tabindex');
      heading.setAttribute('tabindex', '-1');
      const restore = () => {
        if (originalTabindex === null) heading.removeAttribute('tabindex');
        else heading.setAttribute('tabindex', originalTabindex);
        heading.removeEventListener('blur', restore);
        if (restoreHeadingFocus === restore) restoreHeadingFocus = undefined;
      };
      restoreHeadingFocus = restore;
      heading.addEventListener('blur', restore, { once: true, signal });
      heading.focus({ preventScroll: true });
    }, { signal });
  }
  document.addEventListener('site:search-open', () => close(true), { signal });
  document.addEventListener('site:image-open', () => close(true), { signal });
  window.addEventListener('scroll', scheduleUpdate, { passive: true, signal });
  window.addEventListener('resize', scheduleUpdate, { passive: true, signal });
  window.addEventListener('hashchange', scheduleUpdate, { signal });
  window.addEventListener('pageshow', scheduleUpdate, { signal });
  window.addEventListener('pagehide', () => {
    close(true);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    frame = undefined;
  }, { signal });
  desktop?.addEventListener?.('change', () => {
    if (desktop.matches) close(true);
    scheduleUpdate();
  }, { signal });
  openButton.setAttribute('aria-expanded', 'false');
  updateActive();

  return () => {
    close(true);
    controller.abort();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    restoreHeadingFocus?.();
    delete openButton.dataset.ready;
  };
}
