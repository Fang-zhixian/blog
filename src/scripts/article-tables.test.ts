import { afterEach, describe, expect, it } from 'vitest';
import { initArticleTables } from './article-tables';

let dispose: ReturnType<typeof initArticleTables> | undefined;
afterEach(() => { dispose?.(); document.body.replaceChildren(); });

describe('article table scrolling', () => {
  it('wraps plain tables without changing cells and reuses authored wrappers', () => {
    document.body.innerHTML = '<article data-post-content><table><tr><td>原始文字🤔.....?</td></tr></table><div class="table-scroll"><table><tr><td>已有表格</td></tr></table></div></article>';
    const originalTables = Array.from(document.querySelectorAll('table'));
    dispose = initArticleTables();
    expect(document.querySelectorAll('.table-scroll')).toHaveLength(2);
    expect(Array.from(document.querySelectorAll('table'))).toEqual(originalTables);
    expect(originalTables[0].textContent).toBe('原始文字🤔.....?');
    const cleanupDuplicate = initArticleTables();
    expect(document.querySelectorAll('[data-table-hint]')).toHaveLength(2);
    cleanupDuplicate();
    expect(document.querySelectorAll('[data-table-hint]')).toHaveLength(2);
  });

  it('shows a hint and keyboard entry only when the table overflows', () => {
    document.body.innerHTML = '<article data-post-content><div class="table-scroll" aria-label="对照数据"><table><tr><td>数据</td></tr></table></div></article>';
    const wrapper = document.querySelector<HTMLElement>('.table-scroll')!;
    let width = 300;
    Object.defineProperty(wrapper, 'clientWidth', { get: () => width });
    Object.defineProperty(wrapper, 'scrollWidth', { get: () => 640 });
    dispose = initArticleTables();
    const hint = document.querySelector<HTMLElement>('[data-table-hint]')!;
    expect(hint.hidden).toBe(false);
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(wrapper).toHaveAttribute('aria-label', '对照数据');
    width = 800;
    window.dispatchEvent(new Event('resize'));
    expect(hint.hidden).toBe(true);
    expect(wrapper).not.toHaveAttribute('tabindex');
    expect(wrapper).not.toHaveAttribute('role');
  });

  it('restores authored attributes and releases enhancements on cleanup', () => {
    document.body.innerHTML = '<article data-post-content><table><tr><td>数据</td></tr></table></article>';
    dispose = initArticleTables();
    dispose();
    expect(document.querySelector('.table-scroll')).toBeNull();
    expect(document.querySelector('[data-table-hint]')).toBeNull();
    expect(document.querySelector('article > table')).not.toBeNull();
    window.dispatchEvent(new Event('resize'));
    dispose = undefined;
  });
});
