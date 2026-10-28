// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { generateImage, getProviderOrder, type ImageProvider } from '../providers';
import { buildConceptPrompt, VARIATION_HINTS } from '../prompt';
import { checkGenerationQuota } from '../jobs';

const image = { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' };

function provider(id: ImageProvider['id'], configured: boolean, generate: ImageProvider['generate'] = async () => image): ImageProvider {
  return { id, isConfigured: () => configured, generate };
}

describe('provider selection', () => {
  it('puts the configured primary first and drops unconfigured providers', () => {
    const pixazo = provider('pixazo', true);
    const cloudflare = provider('cloudflare', true);
    expect(getProviderOrder([pixazo, cloudflare], 'cloudflare').map((p) => p.id)).toEqual(['cloudflare', 'pixazo']);
    expect(getProviderOrder([pixazo, provider('cloudflare', false)], 'cloudflare').map((p) => p.id)).toEqual(['pixazo']);
  });

  it('falls back to the next provider when the primary fails', async () => {
    const failing = provider('pixazo', true, vi.fn().mockRejectedValue(new Error('balance is insufficient')));
    const working = provider('cloudflare', true);
    await expect(generateImage({ prompt: 'p' }, [failing, working])).resolves.toEqual({ provider: 'cloudflare', image });
  });

  it('reports every failure when all providers fail', async () => {
    const a = provider('pixazo', true, vi.fn().mockRejectedValue(new Error('A down')));
    const b = provider('cloudflare', true, vi.fn().mockRejectedValue(new Error('B down')));
    await expect(generateImage({ prompt: 'p' }, [a, b])).rejects.toThrow(/pixazo: A down \| cloudflare: B down/);
  });

  it('explains when no provider is configured', async () => {
    await expect(generateImage({ prompt: 'p' }, [])).rejects.toThrow(/No image provider is configured/);
  });
});

describe('concept prompt', () => {
  it('includes the idea, medium style, a variation hint, and the no-text rule', () => {
    const prompt = buildConceptPrompt({ idea: ' a fox in a teacup ', medium: 'watercolor', variation: 1 });
    expect(prompt).toContain('a fox in a teacup.');
    expect(prompt).toContain('watercolour');
    expect(prompt).toContain(VARIATION_HINTS[1]);
    expect(prompt).toMatch(/Do not include any words/);
  });

  it('gives each of the four concepts a different composition', () => {
    const prompts = [0, 1, 2, 3].map((variation) => buildConceptPrompt({ idea: 'x', medium: 'pencil', variation }));
    expect(new Set(prompts).size).toBe(4);
  });
});

describe('generation quota', () => {
  it('allows a batch only when it fits in the hourly limit', () => {
    expect(checkGenerationQuota(0, 4, 10)).toEqual({ allowed: true, remaining: 10, limit: 10 });
    expect(checkGenerationQuota(6, 4, 10).allowed).toBe(true);
    expect(checkGenerationQuota(7, 4, 10)).toEqual({ allowed: false, remaining: 3, limit: 10 });
    expect(checkGenerationQuota(15, 4, 10).remaining).toBe(0);
  });
});
