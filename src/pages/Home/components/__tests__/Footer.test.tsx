import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../../../../components/Footer';

describe('Footer', () => {
  describe('Rendering', () => {
    it('should render footer element', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('should display copyright text', () => {
      render(<Footer />);

      expect(screen.getByText(/© 2024 Inkloom. All rights reserved./i)).toBeInTheDocument();
    });

    it('should render copyright in paragraph element', () => {
      const { container } = render(<Footer />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveTextContent('© 2024 Inkloom. All rights reserved.');
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes applied to footer', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
      expect(footer?.className).toContain('footer');
      expect(footer?.className).toContain('footerDark');
    });

    it('should have footerContent div', () => {
      const { container } = render(<Footer />);

      const footerContent = container.querySelector('footer > div');
      expect(footerContent).toBeInTheDocument();
      expect(footerContent?.className).toContain('footerContent');
    });

    it('should apply text classes', () => {
      const { container } = render(<Footer />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.className).toContain('footerText');
      expect(paragraph?.className).toContain('footerTextDark');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as contentinfo landmark', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });
  });
});
