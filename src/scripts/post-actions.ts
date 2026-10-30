export function getShareUrl(location: Pick<Location, 'hostname' | 'origin' | 'pathname' | 'href'>, canonical?: string) {
  if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname)) {
    return new URL(location.pathname, location.origin).href;
  }
  return canonical || location.href;
}

export function initPostActions() {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-post-link]');
  const status = document.querySelector<HTMLElement>('[data-copy-link-status]');
  const fallback = document.querySelector<HTMLElement>('[data-copy-link-fallback]');
  const input = document.querySelector<HTMLInputElement>('[data-copy-link-value]');
  if (!button || !status || !fallback || !input) return;
  button.addEventListener('click', async () => {
    const url = getShareUrl(window.location, document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href);
    try {
      await navigator.clipboard.writeText(url);
      fallback.hidden = true;
      status.textContent = document.documentElement.dataset.lang === 'en' ? 'Link copied and ready to share.' : '链接已复制，可以分享给朋友了。';
    } catch {
      fallback.hidden = false;
      input.value = url;
      input.focus();
      input.select();
      status.textContent = document.documentElement.dataset.lang === 'en' ? 'Please copy the link below.' : '请复制下方链接。';
    }
  });
}
