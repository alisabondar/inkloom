import type { Medium } from '@/lib/plan';

const MEDIUM_STYLE: Record<Medium, string> = {
  pencil: 'a hand-drawn graphite sketch on paper with confident contours and visible pencil hatching',
  watercolor: 'a loose watercolour sketch on cold-press paper with soft bleeding washes, visible brush marks and clearly separated light, mid, and dark areas',
  acrylic: 'an impressionist alla prima acrylic painting with thick impasto brushstrokes, palette-knife texture, matte paint, simplified shapes and loose, unfinished edges',
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
    // Ideas like "still life" or "portrait" pull image models towards photographs. Describing the hand-made
    // look works better than negatives ("not photorealistic"), which these models tend to ignore.
    'Painterly and hand-made: visible marks of the brush, pen or pencil, soft imperfect edges and a matte texture, like a page from a sketchbook.',
    'Do not include any words, letters, numbers, signatures, watermarks, frames, or borders.',
  ].join(' ');
}
