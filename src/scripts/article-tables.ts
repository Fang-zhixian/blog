/** Give wide article tables their own discoverable, keyboard-accessible scroll area. */
export function initArticleTables(root: ParentNode = document) {
  const controller = new window.AbortController();
  let disposed = false;
  const entries = Array.from(root.querySelectorAll<HTMLTableElement>('[data-post-content] table')).flatMap((table) => {
    const existing = table.parentElement?.classList.contains('table-scroll') ? table.parentElement : null;
    if (existing?.dataset.tableReady === 'true') return [];
    const wrapper = existing ?? document.createElement('div');
    if (!existing) {
      wrapper.className = 'table-scroll';
      table.before(wrapper);
      wrapper.append(table);
    }
    const attributes = ['tabindex', 'role', 'aria-label'] as const;
    const original = attributes.map((name) => [name, wrapper.getAttribute(name)] as const);
    const restore = () => original.forEach(([name, value]) => {
      if (value === null) wrapper.removeAttribute(name);
      else wrapper.setAttribute(name, value);
    });
    const hint = document.createElement('span');
    hint.dataset.tableHint = 'true';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = '左右滑动查看完整表格';
    hint.hidden = true;
    wrapper.before(hint);
    wrapper.dataset.tableReady = 'true';

    return [{ table, wrapper, hint, restore, existing }];
  });
  const update = () => {
    if (disposed) return;
    for (const { wrapper, hint, restore } of entries) {
      const overflow = wrapper.scrollWidth > wrapper.clientWidth + 1;
      hint.hidden = !overflow;
      if (overflow) {
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        if (!wrapper.hasAttribute('aria-label')) wrapper.setAttribute('aria-label', '表格，可左右滚动查看完整内容');
      } else restore();
    }
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : undefined;
  entries.forEach(({ wrapper, table }) => {
    observer?.observe(wrapper);
    observer?.observe(table);
  });
  window.addEventListener('resize', update, { signal: controller.signal });
  window.addEventListener('pageshow', update, { signal: controller.signal });
  void document.fonts?.ready.then(update);
  update();

  return () => {
    disposed = true;
    controller.abort();
    observer?.disconnect();
    for (const { table, wrapper, hint, restore, existing } of entries) {
      hint.remove();
      delete wrapper.dataset.tableReady;
      restore();
      if (!existing) wrapper.replaceWith(table);
    }
  };
}
