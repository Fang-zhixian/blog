/** Animate native details without changing their keyboard or no-JavaScript behavior. */
export function initDisclosureMotion(root: ParentNode = document): () => void {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const disclosures = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-animated-disclosure]'));
  const controllers = disclosures.flatMap((details) => {
    const summary = Array.from(details.children).find((child): child is HTMLElement =>
      child instanceof HTMLElement && child.tagName === 'SUMMARY');
    if (!summary) return [];

    const properties = ['height', 'overflow-x', 'overflow-y'] as const;
    const originalStyles = properties.map((property) => ({
      property,
      value: details.style.getPropertyValue(property),
      priority: details.style.getPropertyPriority(property),
    }));
    let animation: Animation | undefined;
    let intendedOpen = details.open;

    const restoreStyles = () => {
      for (const { property, value, priority } of originalStyles) {
        if (value) details.style.setProperty(property, value, priority);
        else details.style.removeProperty(property);
      }
    };
    const cancelAnimation = () => {
      const previous = animation;
      animation = undefined;
      if (previous) {
        previous.onfinish = null;
        previous.oncancel = null;
        previous.cancel();
      }
    };
    const settle = () => {
      // A pagehide can occur while idle; preserve any native/programmatic change.
      if (!animation) intendedOpen = details.open;
      cancelAnimation();
      details.open = intendedOpen;
      restoreStyles();
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const interactive = event.target instanceof Element
        ? event.target.closest('a, button, input, select, textarea, [contenteditable]')
        : null;
      if (interactive && interactive !== summary && summary.contains(interactive)) return;

      event.preventDefault();
      const startHeight = details.getBoundingClientRect().height;
      intendedOpen = !(animation ? intendedOpen : details.open);
      cancelAnimation();
      restoreStyles();

      // Measuring the requested native state also includes borders and padding.
      details.open = intendedOpen;
      if (reducedMotion?.matches || typeof details.animate !== 'function') return;
      const endHeight = details.getBoundingClientRect().height;
      if (startHeight === endHeight) return;

      const computed = window.getComputedStyle(details);
      const contentBoxInset = computed.boxSizing === 'border-box' ? 0 :
        ['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width']
          .reduce((sum, property) => sum + (Number.parseFloat(computed.getPropertyValue(property)) || 0), 0);
      const cssHeight = (height: number) => `${Math.max(0, height - contentBoxInset)}px`;

      // Keep the content rendered until a closing animation completes.
      details.open = true;
      details.style.height = cssHeight(startHeight);
      details.style.overflowX = 'hidden';
      details.style.overflowY = 'hidden';
      try {
        const current = details.animate(
          [{ height: cssHeight(startHeight) }, { height: cssHeight(endHeight) }],
          { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'both' },
        );
        animation = current;
        current.onfinish = current.oncancel = () => {
          if (animation === current) settle();
        };
      } catch {
        // A failed animation must still honor the last click and release layout.
        details.open = intendedOpen;
        restoreStyles();
      }
    };

    summary.addEventListener('click', onClick);
    return [{
      settle,
      dispose() {
        settle();
        summary.removeEventListener('click', onClick);
      },
    }];
  });

  const settleAll = () => controllers.forEach((controller) => controller.settle());
  const onMotionPreferenceChange = () => {
    if (reducedMotion?.matches) settleAll();
  };
  // Finish transitions before BFCache storage, but retain click listeners for restore.
  window.addEventListener('pagehide', settleAll);
  reducedMotion?.addEventListener?.('change', onMotionPreferenceChange);

  return () => {
    window.removeEventListener('pagehide', settleAll);
    reducedMotion?.removeEventListener?.('change', onMotionPreferenceChange);
    controllers.forEach((controller) => controller.dispose());
  };
}
