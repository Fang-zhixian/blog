/** Keep the native mobile disclosure predictable across overlays and page restores. */
export function initNavigation(root: ParentNode = document) {
  const nav = root.querySelector<HTMLElement>('#site-nav');
  const menu = nav?.querySelector<HTMLDetailsElement>('#mobile-nav');
  const summary = menu?.querySelector<HTMLElement>('summary');
  const panel = menu?.querySelector<HTMLElement>('.mobile-nav-panel');
  if (!nav || !menu || !summary || !panel || menu.dataset.ready === 'true') return;

  const controller = new window.AbortController();
  const { signal } = controller;
  const desktop = window.matchMedia?.('(min-width: 768px)');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const originalPointerEvents = panel.style.pointerEvents;
  const originallyInert = panel.hasAttribute('inert');
  let intendedOpen = menu.open;
  let animation: Animation | undefined;
  menu.dataset.ready = 'true';

  const syncLabel = () => {
    summary.setAttribute('aria-label', intendedOpen ? '关闭菜单' : '打开菜单');
    summary.setAttribute('aria-expanded', String(intendedOpen));
  };
  const restorePanel = () => {
    panel.style.pointerEvents = originalPointerEvents;
    panel.toggleAttribute('inert', originallyInert);
  };
  const cancelAnimation = () => {
    const previous = animation;
    animation = undefined;
    if (!previous) return;
    previous.onfinish = previous.oncancel = null;
    previous.cancel();
  };
  const settle = (open = intendedOpen) => {
    cancelAnimation();
    intendedOpen = open;
    menu.open = open;
    restorePanel();
    syncLabel();
  };
  const setOpen = (open: boolean, immediate = false) => {
    if (!animation && menu.open === open) {
      intendedOpen = open;
      syncLabel();
      return;
    }
    const wasOpen = menu.open;
    const current = wasOpen ? window.getComputedStyle(panel) : null;
    const start = {
      opacity: current?.opacity || '0',
      transform: current?.transform || 'translateY(-5px)',
    };
    cancelAnimation();
    intendedOpen = open;
    syncLabel();
    if (immediate || reducedMotion?.matches || typeof panel.animate !== 'function') {
      settle(open);
      return;
    }

    // Keep the closing frame rendered, but prevent its links receiving input.
    menu.open = true;
    panel.style.pointerEvents = open ? originalPointerEvents : 'none';
    panel.toggleAttribute('inert', !open || originallyInert);
    try {
      const next = panel.animate([
        start,
        { opacity: open ? '1' : '0', transform: open ? 'translateY(0)' : 'translateY(-5px)' },
      ], { duration: 160, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'both' });
      animation = next;
      next.onfinish = next.oncancel = () => {
        if (animation === next) settle();
      };
    } catch {
      settle(open);
    }
  };
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
  const closeImmediately = () => settle(false);
  const outside = (event: Event) => {
    if (!(event.target instanceof Element) || menu.contains(event.target) || !menu.open) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    const click = event as MouseEvent;
    const navigates = event.type === 'click' && !event.defaultPrevented && click.button === 0 &&
      !click.metaKey && !click.ctrlKey && !click.shiftKey && !click.altKey &&
      link && (!link.target || link.target === '_self') && !link.hasAttribute('download');
    const opensOverlay = Boolean(event.target.closest('[data-search-open], [data-theme-toggle], [data-toc-open]'));
    if (!intendedOpen && !navigates && !opensOverlay) return;
    setOpen(false, Boolean(navigates) || opensOverlay);
  };

  summary.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    event.preventDefault();
    setOpen(!(animation ? intendedOpen : menu.open));
  }, { signal });
  menu.addEventListener('toggle', () => {
    if (!animation) {
      intendedOpen = menu.open;
      syncLabel();
    }
  }, { signal });
  menu.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (link && (!link.target || link.target === '_self') && !link.hasAttribute('download')) closeImmediately();
  }, { signal });
  document.addEventListener('pointerdown', outside, { signal });
  document.addEventListener('click', outside, { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    event.preventDefault();
    setOpen(false);
    summary.focus({ preventScroll: true });
  }, { signal });
  document.addEventListener('site:search-open', closeImmediately, { signal });
  document.addEventListener('site:toc-open', closeImmediately, { signal });
  document.addEventListener('site:image-open', closeImmediately, { signal });
  window.addEventListener('scroll', onScroll, { passive: true, signal });
  window.addEventListener('pagehide', closeImmediately, { signal });
  window.addEventListener('pageshow', onScroll, { signal });
  desktop?.addEventListener?.('change', () => {
    if (desktop.matches) closeImmediately();
  }, { signal });
  reducedMotion?.addEventListener?.('change', () => {
    if (reducedMotion.matches) settle();
  }, { signal });
  if (desktop?.matches) closeImmediately();
  syncLabel();
  onScroll();

  return () => {
    settle();
    controller.abort();
    delete menu.dataset.ready;
  };
}
