import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../save-template';
import { NextApiRequest, NextApiResponse } from 'next';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('/api/save-template', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      method: 'POST',
      body: {},
    };

    mockRes = {
      status: statusMock as any,
      json: jsonMock,
    };
  });

  describe('Template Insertion', () => {
    it('should successfully save template with all fields', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const mockTemplate = {
        id: 'template-123',
        user_id: '1',
        title: 'Beautiful Sunset',
        medium: 'Watercolor',
        difficulty: 'intermediate',
        duration: '2-3 hours',
        generated_image_id: 'img-456',
        image_url: 'https://storage.test.com/image.png',
        source: 'DESCRIPTION',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const selectMock = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockTemplate,
          error: null,
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        select: selectMock,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as any);

      mockReq.body = {
        title: 'Beautiful Sunset',
        medium: 'Watercolor',
        difficulty: 'intermediate',
        duration: '2-3 hours',
        generated_image_id: 'img-456',
        image_url: 'https://storage.test.com/image.png',
        source: 'DESCRIPTION',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Beautiful Sunset',
          medium: 'Watercolor',
          difficulty: 'intermediate',
          duration: '2-3 hours',
          generated_image_id: 'img-456',
          image_url: 'https://storage.test.com/image.png',
          source: 'DESCRIPTION',
          user_id: '1',
        }),
      ]);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        template: mockTemplate,
      });
    });

    it('should use default title when title is empty string', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const selectMock = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '1', title: 'Untitled Template' },
          error: null,
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        select: selectMock,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as any);

      mockReq.body = {
        title: '',
        medium: 'Oil',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-123',
        image_url: 'https://test.url',
        source: 'DESCRIPTION',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Untitled Template',
        }),
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database insertion errors', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const selectMock = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed', code: 'DB_ERROR' },
        }),
      });

      const insertMock = vi.fn().mockReturnValue({
        select: selectMock,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as any);

      mockReq.body = {
        title: 'Test',
        medium: 'Oil',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-123',
        image_url: 'https://test.url',
        source: 'DESCRIPTION',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to save template to database',
      });
    });

    it('should handle unexpected errors', async () => {
      const { supabase } = await import('../../../lib/supabase');

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      mockReq.body = {
        title: 'Test',
        medium: 'Oil',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-123',
        image_url: 'https://test.url',
        source: 'DESCRIPTION',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to save template',
        details: 'Unexpected error',
      });
    });
  });
});
