import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../get-templates';
import { NextApiRequest, NextApiResponse } from 'next';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('/api/get-templates', () => {
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

  describe('Pagination', () => {
    it('should use default pagination values when not provided', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const limitMock = vi.fn().mockReturnValue({ range: rangeMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(limitMock).toHaveBeenCalledWith(10);
      expect(rangeMock).toHaveBeenCalledWith(0, 9);
    });

    it('should use custom limit and offset from query params', async () => {
      const { supabase } = await import('../../../lib/supabase');

      mockReq.query = {
        limit: '20',
        offset: '40',
      };

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const limitMock = vi.fn().mockReturnValue({ range: rangeMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(limitMock).toHaveBeenCalledWith(20);
      expect(rangeMock).toHaveBeenCalledWith(40, 59);
    });

    it('should calculate range correctly with different offset and limit combinations', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const limitMock = vi.fn().mockReturnValue({ range: rangeMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      // Test case 1: offset 0, limit 5 → range(0, 4)
      mockReq.query = { limit: '5', offset: '0' };
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(rangeMock).toHaveBeenCalledWith(0, 4);

      // Test case 2: offset 10, limit 5 → range(10, 14)
      rangeMock.mockClear();
      mockReq.query = { limit: '5', offset: '10' };
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(rangeMock).toHaveBeenCalledWith(10, 14);
    });
  });

  describe('Query Execution', () => {
    it('should execute correct query with user filter and ordering', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const limitMock = vi.fn().mockReturnValue({ range: rangeMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      // TODO: Update when authentication is implemented to verify user_id from session
      expect(eqMock).toHaveBeenCalledWith('user_id', '1');
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('Success Response', () => {
    it('should handle empty results', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const limitMock = vi.fn().mockReturnValue({ range: rangeMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        templates: [],
        count: 0,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      const { supabase } = await import('../../../lib/supabase');

      const rangeMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
        count: null,
      });

      const limitMock = vi.fn().mockReturnValue({ range: rangeMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to retrieve templates from database',
      });
    });

    it('should handle unexpected errors', async () => {
      const { supabase } = await import('../../../lib/supabase');

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to retrieve templates',
        details: 'Unexpected error',
      });
    });
  });
});
