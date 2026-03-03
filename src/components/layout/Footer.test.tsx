import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('renders author name and footer links', () => {
    render(
      <Footer
        maxWidthClass="max-w-5xl"
        authorName="方植贤"
        links={[
          { href: '/blog', label: 'Blog' },
          { href: '/about', label: 'About' },
        ]}
      />
    );

    expect(screen.getByText(/方植贤/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
