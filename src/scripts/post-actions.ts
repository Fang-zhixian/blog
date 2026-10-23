export function initPostActions() {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-post-link]');
  const status = document.querySelector<HTMLElement>('[data-copy-link-status]');
  const fallback = document.querySelector<HTMLElement>('[data-copy-link-fallback]');
  const input = document.querySelector<HTMLInputElement>('[data-copy-link-value]');
  if (!button || !status || !fallback || !input) return;
  button.addEventListener('click', async () => {
    const url = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      fallback.hidden = true;
      status.textContent = '链接已复制，可以分享给朋友了。';
    } catch {
      fallback.hidden = false;
      input.value = url;
      input.focus();
      input.select();
      status.textContent = '请复制下方链接。';
    }
  });
}
