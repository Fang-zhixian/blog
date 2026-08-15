import { useEffect, useMemo, useRef, useState } from 'react';
import { List, X } from 'lucide-react';
import type { TocHeading } from '../types/blog';

interface Props {
  headings: TocHeading[];
}

function HeadingLinks({
  headings,
  activeId,
  onNavigate,
}: {
  headings: TocHeading[];
  activeId: string;
  onNavigate?: () => void;
}) {
  return (
    <ol className="border-l border-gray-200 dark:border-gray-800">
      {headings.map((heading) => {
        const isActive = heading.slug === activeId;
        return (
          <li key={heading.slug}>
            <a
              href={`#${heading.slug}`}
              data-toc-id={heading.slug}
              aria-current={isActive ? 'location' : undefined}
              onClick={onNavigate}
              className={`block border-l-2 -ml-px py-1.5 text-sm leading-snug transition-colors ${
                heading.depth === 3 ? 'pl-6' : 'pl-4'
              } ${
                isActive
                  ? 'border-black text-black dark:border-white dark:text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export default function TableOfContents({ headings }: Props) {
  const tocHeadings = useMemo(
    () => headings.filter((heading) => heading.depth === 2 || heading.depth === 3),
    [headings],
  );
  const headingKey = tocHeadings.map((heading) => heading.slug).join('|');
  const [activeId, setActiveId] = useState(tocHeadings[0]?.slug ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const headingElements = tocHeadings
      .map((heading) => document.getElementById(heading.slug))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headingElements.length === 0) {
      return;
    }

    const visible = new Map<string, boolean>();

    const updateActive = () => {
      const intersecting = tocHeadings.filter((heading) => visible.get(heading.slug));
      if (intersecting.length > 0) {
        setActiveId(intersecting[0].slug);
        return;
      }

      const above = headingElements.filter((element) => element.getBoundingClientRect().top < 128);
      const lastAbove = above[above.length - 1];
      if (lastAbove) {
        setActiveId(lastAbove.id);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting);
        }
        updateActive();
      },
      {
        rootMargin: '-96px 0px -65% 0px',
        threshold: [0, 1],
      },
    );

    headingElements.forEach((element) => observer.observe(element));
    updateActive();

    return () => observer.disconnect();
  }, [headingKey, tocHeadings]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) {
      return;
    }

    const activeLink = nav.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(activeId)}"]`);
    if (!activeLink) {
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
      nav.scrollTop += linkRect.top - navRect.top - nav.clientHeight / 2 + linkRect.height / 2;
    }
  }, [activeId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (tocHeadings.length === 0) {
    return null;
  }

  return (
    <>
      <nav
        ref={navRef}
        aria-label="文章目录"
        className="hidden xl:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">目录</p>
        <HeadingLinks headings={tocHeadings} activeId={activeId} />
      </nav>

      <button
        type="button"
        className="xl:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium"
        aria-expanded={isOpen}
        aria-controls="mobile-toc"
        onClick={() => setIsOpen(true)}
      >
        <List size={16} />
        目录
      </button>

      {isOpen && (
        <div className="xl:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="关闭目录"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="mobile-toc"
            role="dialog"
            aria-modal="true"
            aria-label="文章目录"
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-[#fafafa] dark:bg-[#0f0f0f] px-6 pt-5 pb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">目录</p>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="关闭目录">
                <X size={20} />
              </button>
            </div>
            <HeadingLinks headings={tocHeadings} activeId={activeId} onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
