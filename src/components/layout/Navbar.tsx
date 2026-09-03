import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import Search, { type SearchResult } from '../Search';
import MobileMenu from './MobileMenu';

interface NavItem {
  name: string;
  href: string;
}

interface Props {
  navItems: NavItem[];
  maxWidthClass: string;
  activePath?: string;
  searchIndex?: SearchResult[];
}

export default function Navbar({ navItems, maxWidthClass, activePath, searchIndex = [] }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className={`${maxWidthClass} mx-auto px-6 flex justify-end items-center`}>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-8 text-sm font-medium">
              {navItems.map((item, index) => {
                const isActive = activePath === item.href;
                return (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`hover:text-gray-500 dark:hover:text-gray-300 transition-colors ${
                      isActive
                        ? 'text-black dark:text-white'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {item.name}
                  </motion.a>
                );
              })}
            </div>
            <Search searchIndex={searchIndex} />
            <ThemeToggle />
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Search searchIndex={searchIndex} />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>
      <MobileMenu isOpen={isMobileMenuOpen} navItems={navItems} />
    </>
  );
}
