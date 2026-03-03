import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import Search from '../Search';

interface NavItem {
  name: string;
  href: string;
}

interface Props {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navItems: NavItem[];
  maxWidthClass: string;
  activePath?: string;
}

export default function Navbar({
  isScrolled,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  navItems,
  maxWidthClass,
  activePath,
}: Props) {
  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className={`${maxWidthClass} mx-auto px-6 flex justify-between items-center`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tighter"
        >
          <a href="/">
            DESIGNER<span className="text-gray-400">.BLOG</span>
          </a>
        </motion.div>

        <div className="hidden md:flex items-center space-x-6">
          <div className="flex space-x-8 text-sm font-medium">
            {navItems.map((item, index) => {
              const isActive = activePath === item.href;
              return (
                <motion.a
                  key={item.name}
                  href={item.href}
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
          <Search />
          <ThemeToggle />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <Search />
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
