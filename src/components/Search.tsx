/**
 * Search component using Fuse.js for client-side search
 */
import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Search as SearchIcon, X } from 'lucide-react';

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
}

const fuseOptions = {
  keys: ['title', 'description', 'tags'],
  threshold: 0.3,
  includeScore: true,
};

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
  const [fuse, setFuse] = useState<Fuse<SearchResult> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load search index
    fetch('/search.json')
      .then((res) => res.json())
      .then((data) => {
        setSearchIndex(data);
        setFuse(new Fuse(data, fuseOptions));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query && fuse) {
      const searchResults = fuse.search(query);
      setResults(searchResults.map((result) => result.item).slice(0, 10));
    } else {
      setResults([]);
    }
  }, [query, fuse]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      // Open search with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open search"
      >
        <SearchIcon size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-w-2xl mx-auto mt-20 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
              <SearchIcon size={20} className="text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索文章..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <button onClick={() => setIsOpen(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <a
                    key={result.slug}
                    href={`/blog/${result.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  </a>
                ))}
              </div>
            )}

            {query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                未找到相关文章
              </div>
            )}

            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 flex justify-between">
              <span>按 ESC 关闭</span>
              <span>⌘K 打开搜索</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
