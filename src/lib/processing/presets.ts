export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ProcessingSettings {
  detail: number;
  weight: number;
  /** 2..9 */
  valueSteps: number;
  /** 3..16 */
  paletteSize: number;
}

// Sketches stay light (fine 1px lines) so there's room for the artist; presets differ only in
// how much detail they draw. Shading and palette start the same and are tuned separately.
export const SKETCH_WEIGHT = 1;

export const DIFFICULTY_PRESETS: Record<Difficulty, ProcessingSettings> = {
  beginner: { detail: 0.3, weight: SKETCH_WEIGHT, valueSteps: 5, paletteSize: 10 },
  intermediate: { detail: 0.55, weight: SKETCH_WEIGHT, valueSteps: 5, paletteSize: 10 },
  advanced: { detail: 0.8, weight: SKETCH_WEIGHT, valueSteps: 5, paletteSize: 10 },
};

export function settingsForDifficulty(d: Difficulty): ProcessingSettings {
  return { ...DIFFICULTY_PRESETS[d] };
}
