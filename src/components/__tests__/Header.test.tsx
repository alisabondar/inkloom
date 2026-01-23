import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../../../components/Header';

describe('Header', () => {
  describe('Rendering', () => {
    it('should render header element', () => {
      render(<Header title="Test Title" />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should display the provided title', () => {
      render(<Header title="My Application" />);

      expect(screen.getByText('My Application')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept and display different titles', () => {
      const { rerender } = render(<Header title="First Title" />);
      expect(screen.getByText('First Title')).toBeInTheDocument();

      rerender(<Header title="Second Title" />);
      expect(screen.getByText('Second Title')).toBeInTheDocument();
    });

    it('should handle empty string title', () => {
      render(<Header title="" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });

    it('should handle long titles', () => {
      const longTitle = 'This is a very long title that might wrap across multiple lines';
      render(<Header title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialTitle = "Test's Title & More <Tags>";
      render(<Header title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes applied to all elements', () => {
      const { container } = render(<Header title="Test" />);

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
