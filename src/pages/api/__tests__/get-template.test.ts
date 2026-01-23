import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../get-template';
import { NextApiRequest, NextApiResponse } from 'next';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('/api/get-template', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      method: 'GET',
      query: {},
    };

    mockRes = {
      status: statusMock as any,
      json: jsonMock,
    };
  });

  describe('ID Validation', () => {
    it('should reject request when id is missing', async () => {
      mockReq.query = {};

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Template ID is required' });
    });

    it('should accept request when id is a valid string', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const singleMock = vi.fn().mockResolvedValue({
        data: {
          id: 'template-123',
          user_id: '1',
          title: 'Test Template',
          medium: 'Oil',
          difficulty: 'beginner',
          duration: '1 hour',
          generated_image_id: 'img-123',
          image_url: 'https://test.url',
          source: 'DESCRIPTION',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });

      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      mockReq.query = { id: 'template-123' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('Query Execution', () => {
    it('should execute correct query chain', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const singleMock = vi.fn().mockResolvedValue({
        data: {
          id: 'template-456',
          user_id: '1',
          title: 'Test',
          medium: 'Oil',
          difficulty: 'beginner',
          duration: '1 hour',
          generated_image_id: 'img-456',
          image_url: 'https://test.url',
          source: 'DESCRIPTION',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });

      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      mockReq.query = { id: 'template-456' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);


      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('id', 'template-456');
      expect(singleMock).toHaveBeenCalled();
    });
  });

  describe('Success Response', () => {
    it('should return template data on success', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const mockTemplate = {
        id: 'template-789',
        user_id: '1',
        title: 'Beautiful Artwork',
        medium: 'Watercolor',
        difficulty: 'advanced',
        duration: '1 week',
        generated_image_id: 'img-789',
        image_url: 'https://storage.test.com/template-789.png',
        source: 'DESCRIPTION',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const singleMock = vi.fn().mockResolvedValue({
        data: mockTemplate,
        error: null,
      });

      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      mockReq.query = { id: 'template-789' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        template: mockTemplate,
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when template not found (PGRST116)', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      mockReq.query = { id: 'non-existent-id' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Template not found' });
    });

    it('should return 500 for other database errors', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      });

      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      mockReq.query = { id: 'template-123' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to retrieve template from database',
      });
    });

    it('should handle unexpected errors', async () => {
      const { supabase } = await import('../../../lib/supabase');

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      mockReq.query = { id: 'template-123' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to retrieve template',
        details: 'Unexpected error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle numeric id as string', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const mockTemplate = {
        id: '12345',
        user_id: '1',
        title: 'Numeric ID Template',
        medium: 'Oil',
        difficulty: 'beginner',
        duration: '1 hour',
        generated_image_id: 'img-12345',
        image_url: 'https://test.url',
        source: 'DESCRIPTION',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const singleMock = vi.fn().mockResolvedValue({
        data: mockTemplate,
        error: null,
      });

      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      mockReq.query = { id: '12345' };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(eqMock).toHaveBeenCalledWith('id', '12345');
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
