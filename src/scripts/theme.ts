export function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button || button.dataset.ready === 'true') return;

  const html = document.documentElement;
  const controller = new window.AbortController();
  const { signal } = controller;
  let desiredDark = html.classList.contains('dark');
  let revision = 0;
  let transition: ViewTransition | undefined;
  button.dataset.ready = 'true';

  const apply = () => {
    html.classList.toggle('dark', desiredDark);
    button.setAttribute('aria-label', desiredDark ? '切换为浅色模式' : '切换为深色模式');
  };
  const finish = () => {
    revision += 1;
    transition?.skipTransition();
    transition = undefined;
    delete html.dataset.themeTransition;
    apply();
  };
  const syncPreference = () => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') desiredDark = stored === 'dark';
    } catch { /* Keep the visible theme when browser storage is unavailable. */ }
    finish();
  };

  apply();
  button.addEventListener('click', () => {
    desiredDark = !desiredDark;
    try { localStorage.setItem('theme', desiredDark ? 'dark' : 'light'); } catch { /* Switching still works without storage. */ }
    const current = ++revision;
    transition?.skipTransition();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof document.startViewTransition !== 'function') {
      delete html.dataset.themeTransition;
      apply();
      return;
    }
    html.dataset.themeTransition = 'true';
    try {
      transition = document.startViewTransition(() => {
        if (current === revision) apply();
      });
      const settle = () => {
        if (current === revision) {
          transition = undefined;
          delete html.dataset.themeTransition;
        }
      };
      void transition.finished.then(settle, settle);
    } catch {
      delete html.dataset.themeTransition;
      apply();
    }
  }, { signal });
  window.addEventListener('pagehide', finish, { signal });
  window.addEventListener('pageshow', syncPreference, { signal });

  return () => {
    finish();
    controller.abort();
    delete button.dataset.ready;
  };
}
