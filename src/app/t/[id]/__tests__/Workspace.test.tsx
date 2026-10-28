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

const stepperValue = (label: string) => screen.getByRole('group', { name: label }).querySelector('output')?.textContent;
const openFineTune = () => fireEvent.click(screen.getByRole('button', { name: /fine-tune/i }));

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
    openFineTune();
    expect(stepperValue('Grid')).toBe('4×4');
  });

  it('keeps fine-tune collapsed until opened', () => {
    render(<Workspace template={template} isOwner />);
    const toggle = screen.getByRole('button', { name: /fine-tune/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Line detail')).toBeNull();
    openFineTune();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Line detail')).toBeInTheDocument();
  });

  it('preset cards set every setting, fine-tuning marks it custom, and owner changes are saved', async () => {
    vi.useFakeTimers();
    render(<Workspace template={template} isOwner />);
    expect(screen.getByRole('button', { name: /simple/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /detailed/i }));
    expect(screen.getByRole('button', { name: /detailed/i })).toHaveAttribute('aria-pressed', 'true');
    openFineTune();
    expect(stepperValue('Shading')).toBe(`${DIFFICULTY_PRESETS.advanced.valueSteps} tones`);
    expect(stepperValue('Paints')).toBe(`${DIFFICULTY_PRESETS.advanced.paletteSize} colours`);

    fireEvent.click(screen.getByRole('button', { name: 'Increase shading' }));
    expect(stepperValue('Shading')).toBe(`${DIFFICULTY_PRESETS.advanced.valueSteps + 1} tones`);
    expect(screen.getByText(/custom · based on detailed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /detailed/i })).toHaveAttribute('aria-pressed', 'false');

    await act(async () => { vi.advanceTimersByTime(900); });
    expect(actions.updateWorkspaceSettingsAction).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: template.id, valueSteps: DIFFICULTY_PRESETS.advanced.valueSteps + 1, layers: expect.any(String) }),
    );
    vi.useRealTimers();
  });

  it('snaps line detail to its named stops', () => {
    render(<Workspace template={template} isOwner />);
    openFineTune();
    const detail = screen.getByLabelText('Line detail') as HTMLInputElement;
    fireEvent.change(detail, { target: { value: '4' } });
    expect(detail).toHaveAttribute('aria-valuetext', 'All');
  });

  it('hides the palette for single-tool mediums like pencil', () => {
    render(<Workspace template={{ ...template, medium: 'pencil' }} isOwner />);
    openFineTune();
    expect(screen.queryByRole('group', { name: 'Paints' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Paints' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Shading' })).toBeInTheDocument();
  });

  it('non-owners get a read-only view without owner controls or saves', async () => {
    vi.useFakeTimers();
    render(<Workspace template={template} isOwner={false} />);
    expect(screen.queryByTestId('owner-controls')).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    expect(screen.getByText(/@maker/)).toBeInTheDocument();
    openFineTune();
    fireEvent.click(screen.getByRole('button', { name: 'Increase shading' }));
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
