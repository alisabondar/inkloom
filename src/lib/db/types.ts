import type { Difficulty } from '@/lib/processing';
import type { Medium } from '@/lib/plan';

export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ProfileRow {
  id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  favorite_medium: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationRow {
  id: string;
  owner_id: string;
  batch_id: string;
  status: GenerationStatus;
  provider: string | null;
  prompt: string;
  options: GenerationOptions;
  result_path: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

export interface GenerationOptions {
  idea: string;
  medium: Medium;
  title?: string;
  variation?: number;
}

// Workspace state saved with a template (see the workspace page).
export interface WorkspaceSettings {
  detail?: number;
  weight?: number;
  valueSteps?: number;
  paletteSize?: number;
  gridSize?: number;
  layers?: Partial<Record<WorkspaceLayer, boolean>>;
}

export type WorkspaceLayer = 'lines' | 'values' | 'numbers' | 'grid' | 'colour';

export interface TemplateRow {
  id: string;
  owner_id: string;
  generation_id: string | null;
  title: string;
  medium: Medium;
  difficulty: Difficulty;
  prompt: string | null;
  concept_path: string;
  settings: WorkspaceSettings;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProfileRow {
  id: string;
  username: string | null;
}
