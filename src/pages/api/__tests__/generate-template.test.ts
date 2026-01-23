import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../generate-template';
import { NextApiRequest, NextApiResponse } from 'next';

const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        create: mockCreate,
      },
    })),
  };
});

vi.mock('../../../lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      }),
    },
  },
}));

describe('/api/generate-template', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();

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

  describe('Prompt Generation', () => {
    it('should generate basic prompt with minimal input', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'test-response-id',
        output: [{
          type: 'image_generation_call',
          result: 'data:image/png;base64,iVBORw0KGgoAAAANS',
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url/image.png' } }),
      } as any);

      mockReq.body = {
        description: 'A sunset landscape',
        title: 'Sunset Art',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5',
          input: expect.stringContaining('Sunset Art'),
        })
      );
    });

    it('should adjust prompt complexity for difficulty', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'test-id',
        output: [{
          type: 'image_generation_call',
          result: 'data:image/png;base64,test',
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
      } as any);

      mockReq.body = {
        description: 'Test',
        workDifficulty: 'advanced',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.input).toContain('highly detailed');
      expect(callArgs.input).toContain('many intricate lines');
    });

    it('should adjust prompt based on duration', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'test-id',
        output: [{
          type: 'image_generation_call',
          result: 'data:image/png;base64,test',
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
      } as any);

      mockReq.body = {
        description: 'Test',
        workDuration: '2-3 days',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.input).toContain('careful, precise linework');
      expect(callArgs.input).toContain('refined details');
    });
  });

  describe('Image Generation', () => {
    it('should successfully generate and upload image', async () => {
      const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANS';
      mockCreate.mockResolvedValueOnce({
        id: 'response-123',
        output: [{
          type: 'image_generation_call',
          result: mockImageData,
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      const uploadMock = vi.fn().mockResolvedValue({
        data: { path: 'template-123.png' },
        error: null
      });
      const getPublicUrlMock = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/templates/template-123.png' }
      });

      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      } as any);

      mockReq.body = {
        description: 'A beautiful landscape',
        title: 'Landscape Template',
        workMedium: 'Watercolor',
        workDifficulty: 'intermediate',
        workDuration: '2-3 hours',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(/^template-\d+-response-123\.png$/),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        })
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        image: mockImageData,
        image_url: 'https://storage.supabase.co/templates/template-123.png',
        prompt: expect.any(String),
        title: 'Landscape Template',
        medium: 'Watercolor',
        difficulty: 'intermediate',
        duration: '2-3 hours',
        generated_image_id: 'response-123',
        source: 'DESCRIPTION',
      });
    });

    it('should handle OpenAI API errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('OpenAI API rate limit exceeded'));

      mockReq.body = {
        description: 'Test',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to generate image',
        details: 'OpenAI API rate limit exceeded',
      });
    });

    it('should handle no image generated error', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'test-id',
        output: [],
      } as any);

      mockReq.body = {
        description: 'Test',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to generate image',
        details: 'No image generated',
      });
    });
  });

  describe('Storage Upload', () => {
    it('should handle storage upload errors', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'test-id',
        output: [{
          type: 'image_generation_call',
          result: 'data:image/png;base64,test',
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage quota exceeded' }
        }),
        getPublicUrl: vi.fn(),
      } as any);

      mockReq.body = {
        description: 'Test',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to generate image',
        details: 'Failed to upload image to storage',
      });
    });

    it('should generate unique filename using timestamp and response ID', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'unique-response-id',
        output: [{
          type: 'image_generation_call',
          result: 'data:image/png;base64,test',
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null });

      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: uploadMock,
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
      } as any);

      mockReq.body = {
        description: 'Test',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(/^template-\d+-unique-response-id\.png$/),
        expect.any(Buffer),
        expect.any(Object)
      );
    });
  });

  describe('Response Format', () => {
    it('should return all required fields in success response', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'test-id',
        output: [{
          type: 'image_generation_call',
          result: 'data:image/png;base64,test',
        }],
      } as any);

      const { supabaseAdmin } = await import('../../../lib/supabase');
      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url/image.png' } }),
      } as any);

      mockReq.body = {
        description: 'Test description',
        title: 'Test Title',
        workMedium: 'Oil',
        workDifficulty: 'beginner',
        workDuration: '1 hour',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          image: expect.any(String),
          image_url: expect.any(String),
          prompt: expect.any(String),
          title: 'Test Title',
          medium: 'Oil',
          difficulty: 'beginner',
          duration: '1 hour',
          generated_image_id: 'test-id',
          source: 'DESCRIPTION',
        })
      );
    });
  });
});
