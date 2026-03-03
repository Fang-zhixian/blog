interface FooterLink {
  href: string;
  label: string;
}

interface Props {
  maxWidthClass: string;
  links: FooterLink[];
  authorName: string;
}

export default function Footer({ maxWidthClass, links, authorName }: Props) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`${maxWidthClass} mx-auto px-6 py-12 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 dark:text-gray-500`}
    >
      <p>
        © {currentYear} {authorName}. Built with Astro & Tailwind.
      </p>
      <div className="flex space-x-6 mt-4 md:mt-0">
        {links.map((link) => (
          <a key={link.label} href={link.href} className="hover:text-black dark:hover:text-white transition-colors">
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
