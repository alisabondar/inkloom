import type { Medium } from '@/lib/plan';

const MEDIUM_STYLE: Record<Medium, string> = {
  pencil: 'a finished graphite and ink illustration with clear contours',
  watercolor: 'a watercolour painting with soft washes and clearly separated light, mid, and dark areas',
  acrylic: 'an acrylic painting with bold, simplified shapes and confident colour blocks',
  'paint-by-number': 'a flat-colour illustration made of large, clearly bounded colour areas',
  embroidery: 'a bold illustration with clean outlines and a small set of flat thread-like colours',
  tattoo: 'a bold tattoo flash illustration with strong closed outlines and minimal shading',
};

// One variation hint per concept, so the batch offers different takes on the same idea.
export const VARIATION_HINTS = [
  'balanced composition, eye-level view',
  'closer crop that focuses on the main subject',
  'wide composition with more of the setting',
  'simplified shapes and fewer details',
];

export function buildConceptPrompt(input: { idea: string; medium: Medium; variation?: number }): string {
  const hint = VARIATION_HINTS[(input.variation ?? 0) % VARIATION_HINTS.length];
  return [
    `Create ${MEDIUM_STYLE[input.medium]} of: ${input.idea.trim()}.`,
    `Composition: ${hint}.`,
    'Clear subject, readable silhouette, distinct light and dark values, and a harmonious limited palette so it can be turned into an art template.',
    'Do not include any words, letters, numbers, signatures, watermarks, frames, or borders.',
  ].join(' ');
}
