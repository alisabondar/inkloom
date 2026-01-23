import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key, options) => ({
    url,
    key,
    options,
  })),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Environment Variables', () => {
    it('should use SUPABASE_URL environment variable', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      vi.resetModules();
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      await import('../supabase');

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should use SUPABASE_ANON_KEY for public client', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      vi.resetModules();
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key-123';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      await import('../supabase');

      // Check the first call (public client)
      expect(createClient).toHaveBeenNthCalledWith(
        1,
        'https://test.supabase.co',
        'test-anon-key-123'
      );
    });

    it('should use SUPABASE_SERVICE_ROLE_KEY for admin client', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      vi.resetModules();
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-456';

      await import('../supabase');

      // Check the second call (admin client)
      expect(createClient).toHaveBeenNthCalledWith(
        2,
        'https://test.supabase.co',
        'test-service-role-key-456',
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: false,
          }),
        })
      );
    });
  });

  describe('Client Creation', () => {
    it('should create two separate clients', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      vi.resetModules();
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      await import('../supabase');

      expect(createClient).toHaveBeenCalledTimes(2);
    });

    it('should export supabase client', async () => {
      vi.resetModules();
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { supabase } = await import('../supabase');

      expect(supabase).toBeDefined();
      expect(supabase).toHaveProperty('url');
      expect(supabase).toHaveProperty('key');
    });

    it('should export supabaseAdmin client', async () => {
      vi.resetModules();
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { supabaseAdmin } = await import('../supabase');

      expect(supabaseAdmin).toBeDefined();
      expect(supabaseAdmin).toHaveProperty('url');
      expect(supabaseAdmin).toHaveProperty('key');
      expect(supabaseAdmin).toHaveProperty('options');
    });
  });
});
