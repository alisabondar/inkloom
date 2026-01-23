import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateView } from '../TemplateView';

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  query: {},
  isReady: false,
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={src} alt={alt} data-priority={priority} {...props} />
  ),
}));

vi.mock('../../../components/Header', () => ({
  Header: ({ title }: { title: string }) => <header data-testid="header">{title}</header>,
}));

vi.mock('../../../components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

global.fetch = vi.fn();

describe('TemplateView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
    mockRouter.query = {};
    mockRouter.isReady = false;
  });

  describe('Component Rendering', () => {
    it('should show loading spinner when router is not ready', () => {
      mockRouter.isReady = false;
      render(<TemplateView />);
      expect(screen.getByText('Loading your template...')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error state when no template ID or API fails', async () => {
      mockRouter.isReady = true;
      mockRouter.query = {};
      const { unmount } = render(<TemplateView />);
      await waitFor(() => {
        expect(screen.getByText('No Template Found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create New Template' })).toBeInTheDocument();
      });
      unmount();

      mockRouter.query = { id: 'template-123' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Template not found' }),
      });
      render(<TemplateView />);
      await waitFor(() => {
        expect(screen.getByText('No Template Found')).toBeInTheDocument();
      });
    });

    it('should render template with all UI elements', async () => {
      mockRouter.isReady = true;
      mockRouter.query = { id: 'template-123' };

      const mockTemplate = {
        id: 'template-123',
        user_id: '1',
        title: 'Mountain Landscape',
        medium: 'Oil Painting',
        difficulty: 'advanced',
        duration: '1 week',
        generated_image_id: 'img-123',
        image_url: 'https://storage.example.com/template-image.png',
        source: 'A majestic mountain landscape at dawn',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, template: mockTemplate }),
      });

      render(<TemplateView />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Landscape')).toBeInTheDocument();
        expect(screen.getByText('Oil Painting')).toBeInTheDocument();
        expect(screen.getByText('advanced')).toBeInTheDocument();
        expect(screen.getByText('1 week')).toBeInTheDocument();
        expect(screen.getByText('A majestic mountain landscape at dawn')).toBeInTheDocument();

        const image = screen.getByAltText('Generated template reference') as HTMLImageElement;
        expect(image.src).toContain('storage.example.com/template-image.png');

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Create Another Template' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back to Home' })).toBeInTheDocument();
        expect(screen.getByText(/Download Image/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Data Fetching', () => {
    it('should fetch template data when router is ready with ID', async () => {
      mockRouter.isReady = true;
      mockRouter.query = { id: 'template-123' };

      const mockTemplate = {
        id: 'template-123',
        user_id: '1',
        title: 'Beautiful Sunset',
        medium: 'Watercolor',
        difficulty: 'intermediate',
        duration: '2-3 hours',
        generated_image_id: 'img-123',
        image_url: 'https://test.url/image.png',
        source: 'A beautiful sunset over mountains',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          template: mockTemplate,
        }),
      });

      render(<TemplateView />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/get-template?id=template-123');
      });
    });

    it('should handle fetch errors gracefully', async () => {
      mockRouter.isReady = true;
      mockRouter.query = { id: 'template-123' };

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<TemplateView />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading template:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should navigate to /template when Create New Template or Create Another Template is clicked', async () => {
      mockRouter.isReady = true;
      mockRouter.query = {};
      const { unmount } = render(<TemplateView />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Create New Template' });
        fireEvent.click(button);
      });
      expect(mockPush).toHaveBeenCalledWith('/template');
      unmount();

      vi.clearAllMocks();
      mockRouter.query = { id: 'template-123' };
      const mockTemplate = {
        id: 'template-123',
        user_id: '1',
        title: 'Test',
        medium: 'Oil',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-123',
        image_url: 'https://test.url',
        source: 'Test',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          template: mockTemplate,
        }),
      });

      render(<TemplateView />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Create Another Template' });
        fireEvent.click(button);
      });
      expect(mockPush).toHaveBeenCalledWith('/template');
    });

    it('should navigate to / when Back to Home is clicked', async () => {
      mockRouter.isReady = true;
      mockRouter.query = { id: 'template-123' };

      const mockTemplate = {
        id: 'template-123',
        user_id: '1',
        title: 'Test',
        medium: 'Oil',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-123',
        image_url: 'https://test.url',
        source: 'Test',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          template: mockTemplate,
        }),
      });

      render(<TemplateView />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Back to Home' });
        fireEvent.click(button);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Download Functionality', () => {
    it('should trigger download when Download Image button is clicked', async () => {
      mockRouter.isReady = true;
      mockRouter.query = { id: 'template-123' };

      const mockTemplate = {
        id: 'template-123',
        user_id: '1',
        title: 'Beautiful Sunset',
        medium: 'Watercolor',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-123',
        image_url: 'https://test.url/image.png',
        source: 'Test',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          template: mockTemplate,
        }),
      });

      const mockDate = new Date('2025-10-17T12:00:00Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const mockLink = {
        href: '',
        download: '',
        target: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      render(<TemplateView />);

      await waitFor(() => {
        const button = screen.getByText(/Download Image/i);
        fireEvent.click(button);
      });

      expect(mockLink.href).toBe('https://test.url/image.png');
      expect(mockLink.download).toBe('2025-10-17-BeautifulSunset-reference.png');
      expect(mockLink.target).toBe('_blank');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });
});
