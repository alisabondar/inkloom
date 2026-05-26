import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../common/Header';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe('Header', () => {
  describe('Rendering', () => {
    it('should render header element', () => {
      render(<Header />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should display the home page title', () => {
      render(<Header />);

      expect(screen.getByText('Inkloom')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should render an h1 for the current route title', () => {
      render(<Header />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Inkloom');
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes applied to all elements', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header?.className).toContain('header');
      expect(header?.className).toContain('headerDark');

      const headerContent = header?.querySelector('div');
      expect(headerContent).toBeInTheDocument();
      expect(headerContent?.className).toContain('headerContent');

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.className).toContain('headerTitle');
      expect(heading?.className).toContain('headerTitleDark');
    });
  });
});
