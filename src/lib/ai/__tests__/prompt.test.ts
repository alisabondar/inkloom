// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildConceptPrompt, VARIATION_HINTS } from '@/lib/ai/prompt';

describe('buildConceptPrompt', () => {
  it('asks for a hand-made look for every medium', () => {
    for (const medium of ['pencil', 'watercolor', 'acrylic', 'embroidery', 'tattoo'] as const) {
      const prompt = buildConceptPrompt({ idea: 'a still life of lemons', medium });
      expect(prompt).toContain('a still life of lemons');
      expect(prompt).toMatch(/Painterly and hand-made/);
      expect(prompt).not.toMatch(/photo/i);
    }
  });

  it('asks acrylic for visible brushwork', () => {
    expect(buildConceptPrompt({ idea: 'lemons', medium: 'acrylic' })).toMatch(/impasto brushstrokes/);
  });

  it('cycles the composition hint by variation', () => {
    expect(buildConceptPrompt({ idea: 'x', medium: 'pencil', variation: 1 })).toContain(VARIATION_HINTS[1]);
    expect(buildConceptPrompt({ idea: 'x', medium: 'pencil', variation: VARIATION_HINTS.length })).toContain(VARIATION_HINTS[0]);
  });
});
