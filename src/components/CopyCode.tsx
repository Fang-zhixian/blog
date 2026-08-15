import { useEffect } from 'react';

export default function CopyCode() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll('article pre'));
    const cleanups: Array<() => void> = [];

    blocks.forEach((pre) => {
      if (!(pre instanceof HTMLElement)) {
        return;
      }
      if (pre.parentElement?.dataset.copyCode === 'true') {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.dataset.copyCode = 'true';
      wrapper.className = 'relative group';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'absolute top-3 right-3 px-2 py-1 text-xs rounded bg-white/10 text-gray-200 hover:bg-white/20';
      button.textContent = '复制';

      const handleClick = async () => {
        await navigator.clipboard.writeText(pre.textContent ?? '');
        button.textContent = '已复制';
        window.setTimeout(() => {
          button.textContent = '复制';
        }, 1500);
      };

      button.addEventListener('click', handleClick);
      wrapper.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener('click', handleClick);
        wrapper.parentNode?.insertBefore(pre, wrapper);
        wrapper.remove();
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
