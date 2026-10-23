import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initDisclosureMotion } from './disclosure-motion';

interface TestAnimation {
  onfinish: (() => void) | null;
  oncancel: (() => void) | null;
  cancel: ReturnType<typeof vi.fn>;
}

describe('animated disclosures', () => {
  let details: HTMLDetailsElement;
  let summary: HTMLElement;
  let dispose: (() => void) | undefined;
  let animations: TestAnimation[];
  let animate: ReturnType<typeof vi.fn>;
  let motion: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
  let displayedHeight: number | undefined;

  beforeEach(() => {
    document.body.innerHTML = '<details data-animated-disclosure><summary>浏览标签</summary><div>标签内容</div></details>';
    details = document.querySelector('details')!;
    summary = details.querySelector('summary')!;
    animations = [];
    displayedHeight = undefined;
    motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', vi.fn(() => motion));
    vi.spyOn(details, 'getBoundingClientRect').mockImplementation(() => ({
      height: details.style.height ? (displayedHeight ?? Number.parseFloat(details.style.height)) : (details.open ? 180 : 40),
    }) as DOMRect);
    animate = vi.fn(() => {
      const animation: TestAnimation = { onfinish: null, oncancel: null, cancel: vi.fn() };
      animations.push(animation);
      return animation;
    });
    details.animate = animate as typeof details.animate;
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  const click = () => summary.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

  it('animates opening and closing, then releases its temporary layout styles', () => {
    dispose = initDisclosureMotion();
    click();
    expect(details.open).toBe(true);
    expect(animate.mock.calls[0][0]).toEqual([{ height: '40px' }, { height: '180px' }]);
    animations[0].onfinish!();
    expect(details.style.height).toBe('');
    expect(details.style.overflow).toBe('');

    click();
    expect(details.open).toBe(true);
    expect(animate.mock.calls[1][0]).toEqual([{ height: '180px' }, { height: '40px' }]);
    animations[1].onfinish!();
    expect(details.open).toBe(false);
    expect(details.style.height).toBe('');
  });

  it('reverses from the currently displayed height and honors the last rapid click', () => {
    dispose = initDisclosureMotion();
    click();
    const staleFinish = animations[0].onfinish!;
    displayedHeight = 90;
    click();
    expect(animations[0].cancel).toHaveBeenCalledOnce();
    expect(animate.mock.calls[1][0]).toEqual([{ height: '90px' }, { height: '40px' }]);
    staleFinish();
    expect(details.style.height).toBe('90px');

    displayedHeight = 65;
    click();
    expect(animations[1].cancel).toHaveBeenCalledOnce();
    expect(animate.mock.calls[2][0]).toEqual([{ height: '65px' }, { height: '180px' }]);
    animations[2].onfinish!();
    expect(details.open).toBe(true);
    expect(details.style.height).toBe('');
    expect(details.style.overflow).toBe('');
  });

  it.each(['reduced motion', 'unavailable WAAPI'])('toggles immediately with %s', (reason) => {
    if (reason === 'reduced motion') motion.matches = true;
    else details.animate = undefined as unknown as typeof details.animate;
    dispose = initDisclosureMotion();
    click();
    expect(details.open).toBe(true);
    click();
    expect(details.open).toBe(false);
    expect(animate).not.toHaveBeenCalled();
    expect(details.style.height).toBe('');
    expect(details.style.overflow).toBe('');
  });

  it('settles the latest intent on pagehide and remains interactive after BFCache restore', () => {
    dispose = initDisclosureMotion();
    click();
    displayedHeight = 90;
    click();
    window.dispatchEvent(new Event('pagehide'));
    expect(details.open).toBe(false);
    expect(animations[1].cancel).toHaveBeenCalledOnce();
    expect(details.style.height).toBe('');
    expect(details.style.overflow).toBe('');

    window.dispatchEvent(new Event('pageshow'));
    click();
    expect(animate).toHaveBeenCalledTimes(3);
    animations[2].onfinish!();
    expect(details.open).toBe(true);
  });

  it('cleanup cancels animation, restores existing styles, and removes interception', () => {
    details.style.overflowX = 'clip';
    details.style.overflowY = 'auto';
    details.style.setProperty('height', 'auto', 'important');
    // This fixture has an authored auto height rather than a temporary pixel height.
    vi.mocked(details.getBoundingClientRect).mockImplementation(() => ({ height: details.open ? 180 : 40 }) as DOMRect);
    dispose = initDisclosureMotion();
    click();
    dispose();
    dispose = undefined;
    expect(animations[0].cancel).toHaveBeenCalledOnce();
    expect(details.open).toBe(true);
    expect(details.style.height).toBe('auto');
    expect(details.style.getPropertyPriority('height')).toBe('important');
    expect(details.style.overflowX).toBe('clip');
    expect(details.style.overflowY).toBe('auto');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    summary.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(animate).toHaveBeenCalledOnce();
    expect(motion.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('commits the intended state when animate throws', () => {
    animate.mockImplementation(() => { throw new Error('Animation unavailable'); });
    dispose = initDisclosureMotion();
    click();
    expect(details.open).toBe(true);
    click();
    expect(details.open).toBe(false);
    expect(details.style.height).toBe('');
    expect(details.style.overflow).toBe('');
  });
});
