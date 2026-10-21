import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { TemplateCard } from '@/lib/db/queries';
import { DIFFICULTY_PRESETS } from '@/lib/processing';

const actions = vi.hoisted(() => ({
  updateWorkspaceSettingsAction: vi.fn(async () => ({ ok: true })),
  setVisibilityAction: vi.fn(async () => ({ ok: true })),
  deleteTemplateAction: vi.fn(),
}));
vi.mock('@/app/actions/templates', () => actions);

import { Workspace, initialSettings } from '../Workspace';

const template: TemplateCard = {
  id: '11111111-1111-1111-1111-111111111111',
  owner_id: 'owner',
  generation_id: null,
  title: 'Mountain valley',
  medium: 'watercolor',
  difficulty: 'beginner',
  prompt: null,
  concept_path: 'x.png',
  settings: {},
  is_public: false,
  created_at: '',
  updated_at: '',
  conceptUrl: null, // skips image loading in jsdom
  makerUsername: 'maker',
};

const value = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value;

describe('Workspace', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('merges saved settings over the difficulty preset', () => {
    const s = initialSettings({ difficulty: 'advanced', settings: { valueSteps: 4, layers: { values: true } } });
    expect(s).toMatchObject({ detail: 0.8, valueSteps: 4, gridSize: 0, layers: { lines: true, values: true, grid: false } });
  });

  it('toggles layers and shows the grid overlay', () => {
    render(<Workspace template={template} isOwner />);
    const lines = screen.getByRole('button', { name: /line art/i });
    expect(lines).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(lines);
    expect(lines).toHaveAttribute('aria-pressed', 'false');

    expect(screen.queryByTestId('grid-overlay')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^grid$/i }));
    expect(screen.getByTestId('grid-overlay')).toBeInTheDocument();
    expect(value('Grid')).toBe('4');
  });

  it('difficulty chips reset sliders to the preset, and owner changes are saved', async () => {
    vi.useFakeTimers();
    render(<Workspace template={template} isOwner />);
    expect(value('Value steps')).toBe(String(DIFFICULTY_PRESETS.beginner.valueSteps));
    fireEvent.click(screen.getByRole('button', { name: 'advanced' }));
    expect(value('Value steps')).toBe(String(DIFFICULTY_PRESETS.advanced.valueSteps));
    expect(value('Palette size')).toBe(String(DIFFICULTY_PRESETS.advanced.paletteSize));
    expect(value('Line weight')).toBe(String(DIFFICULTY_PRESETS.advanced.weight));
    await act(async () => { vi.advanceTimersByTime(900); });
    expect(actions.updateWorkspaceSettingsAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: template.id, valueSteps: DIFFICULTY_PRESETS.advanced.valueSteps, layers: expect.any(String) }),
    );
    vi.useRealTimers();
  });

  it('non-owners get a read-only view without owner controls or saves', async () => {
    vi.useFakeTimers();
    render(<Workspace template={template} isOwner={false} />);
    expect(screen.queryByTestId('owner-controls')).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    expect(screen.getByText(/@maker/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Value steps'), { target: { value: '7' } });
    expect(value('Value steps')).toBe('7');
    await act(async () => { vi.advanceTimersByTime(900); });
    expect(actions.updateWorkspaceSettingsAction).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('owners see visibility and delete controls', () => {
    render(<Workspace template={template} isOwner />);
    expect(screen.getByTestId('owner-controls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /make public/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
