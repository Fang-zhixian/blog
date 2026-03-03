import { AnimatePresence, motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
}

interface Props {
  isOpen: boolean;
  navItems: NavItem[];
}

export default function MobileMenu({ isOpen, navItems }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="fixed top-16 left-0 w-full bg-white dark:bg-black z-40 border-b border-gray-100 dark:border-gray-800 md:hidden overflow-hidden"
        >
          <div className="flex flex-col p-6 space-y-4">
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {item.name}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
