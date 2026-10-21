// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const updates: Record<string, unknown>[] = [];
const upload = vi.fn();
const generateImage = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    from: () => ({
      update: (values: Record<string, unknown>) => {
        updates.push(values);
        return { eq: async () => ({ error: null }) };
      },
    }),
    storage: { from: () => ({ upload }) },
  }),
}));

vi.mock('../providers', () => ({ generateImage: (...args: unknown[]) => generateImage(...args) }));

import { runGeneration } from '../jobs';

const generation = { id: 'gen-1', owner_id: 'user-1', prompt: 'a fox' };

describe('runGeneration', () => {
  beforeEach(() => {
    updates.length = 0;
    upload.mockReset();
    generateImage.mockReset();
  });

  it('marks the job running, stores the image under the owner folder, and marks it succeeded', async () => {
    generateImage.mockResolvedValue({ provider: 'cloudflare', image: { bytes: new Uint8Array([1]), contentType: 'image/jpeg' } });
    upload.mockResolvedValue({ error: null });

    await runGeneration(generation, 42);

    expect(generateImage).toHaveBeenCalledWith({ prompt: 'a fox', seed: 42 });
    expect(upload).toHaveBeenCalledWith('user-1/concepts/gen-1.jpg', expect.any(Uint8Array), expect.objectContaining({ contentType: 'image/jpeg' }));
    expect(updates[0]).toEqual({ status: 'running' });
    expect(updates[1]).toMatchObject({ status: 'succeeded', provider: 'cloudflare', result_path: 'user-1/concepts/gen-1.jpg' });
  });

  it('records the error when generation fails', async () => {
    generateImage.mockRejectedValue(new Error('All image providers failed'));

    await runGeneration(generation);

    expect(upload).not.toHaveBeenCalled();
    expect(updates[1]).toMatchObject({ status: 'failed', error: 'All image providers failed' });
  });
});
