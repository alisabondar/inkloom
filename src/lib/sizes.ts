import type { Medium } from './plan';

/** Finished size of a piece, in inches along its longest side (an embroidery hoop's diameter). */
export interface SizeOptions {
  options: number[];
  /** The size the plan's base step times were written for. */
  reference: number;
  /** Shown next to the number, e.g. `8″ hoop`. */
  unit: string;
}

export const SIZES: Record<Medium, SizeOptions> = {
  pencil: { options: [6, 8, 12, 16, 20], reference: 12, unit: 'paper' },
  watercolor: { options: [6, 8, 12, 16, 20, 24], reference: 12, unit: 'paper' },
  acrylic: { options: [8, 12, 16, 20, 24, 36], reference: 12, unit: 'canvas' },
  'paint-by-number': { options: [12, 16, 20, 24], reference: 16, unit: 'canvas' },
  embroidery: { options: [4, 5, 6, 8, 10, 12], reference: 6, unit: 'hoop' },
  tattoo: { options: [2, 3, 4, 6, 8, 10], reference: 4, unit: 'design' },
};

export const formatSize = (medium: Medium, inches: number) => `${inches}″ ${SIZES[medium].unit}`;

export const MIN_SIZE = 1;
export const MAX_SIZE = 48;
