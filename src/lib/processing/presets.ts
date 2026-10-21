export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ProcessingSettings {
  detail: number;
  weight: number;
  /** 2..9 */
  valueSteps: number;
  /** 3..16 */
  paletteSize: number;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, ProcessingSettings> = {
  beginner: { detail: 0.3, weight: 3, valueSteps: 3, paletteSize: 6 },
  intermediate: { detail: 0.55, weight: 2, valueSteps: 5, paletteSize: 10 },
  advanced: { detail: 0.8, weight: 1, valueSteps: 7, paletteSize: 16 },
};

export function settingsForDifficulty(d: Difficulty): ProcessingSettings {
  return { ...DIFFICULTY_PRESETS[d] };
}
