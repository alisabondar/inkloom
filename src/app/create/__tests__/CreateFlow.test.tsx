import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const startConceptsAction = vi.fn();
vi.mock('@/app/actions/generations', () => ({ startConceptsAction: (...a: unknown[]) => startConceptsAction(...a) }));
vi.mock('@/app/actions/uploads', () => ({ useReferencePhotoAction: vi.fn(async () => ({})) }));

import { CreateFlow } from '../CreateFlow';

describe('CreateFlow', () => {
  beforeEach(() => {
    push.mockReset();
    startConceptsAction.mockReset();
  });

  it('selects a medium and enables the next step', () => {
    render(<CreateFlow />);
    const next = screen.getByRole('button', { name: /next: describe it/i });
    expect(next).toBeDisabled();
    const watercolor = screen.getByRole('radio', { name: /watercolor/i });
    fireEvent.click(watercolor);
    expect(watercolor).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /pencil/i })).toHaveAttribute('aria-checked', 'false');
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(screen.getByLabelText('Your idea')).toBeInTheDocument();
  });

  it('preselects the medium from props', () => {
    render(<CreateFlow initialMedium="acrylic" />);
    expect(screen.getByRole('radio', { name: /acrylic/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('validates the idea before generating, and appends detail chips', async () => {
    startConceptsAction.mockResolvedValue({ ok: true, batchId: 'b1', generationIds: ['g1', 'g2'] });
    render(<CreateFlow initialMedium="pencil" initialIdea="" />);
    fireEvent.click(screen.getByRole('button', { name: /next: describe it/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate 4 concepts/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 3 characters/i);
    expect(startConceptsAction).not.toHaveBeenCalled();

    const idea = screen.getByLabelText('Your idea');
    fireEvent.change(idea, { target: { value: 'A fox' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /at golden hour/i }));
    expect(idea).toHaveValue('A fox, at golden hour');

    fireEvent.click(screen.getByRole('button', { name: /generate 4 concepts/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/create/concepts?batch=b1&ids=g1,g2'));
    const form = startConceptsAction.mock.calls[0][1] as FormData;
    expect(form.get('idea')).toBe('A fox, at golden hour');
    expect(form.get('medium')).toBe('pencil');
  });

  it('shows the server error, e.g. the hourly limit', async () => {
    startConceptsAction.mockResolvedValue({ error: "You've reached 20 concepts this hour." });
    render(<CreateFlow initialMedium="pencil" initialIdea="A quiet harbour" />);
    fireEvent.click(screen.getByRole('button', { name: /generate 4 concepts/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/this hour/);
    expect(push).not.toHaveBeenCalled();
  });

  it('rejects photos that are too large', () => {
    render(<CreateFlow initialMedium="pencil" initialIdea="A quiet harbour" />);
    const big = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 9 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText(/reference photo/i), { target: { files: [big] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/8 MB/);
    expect(screen.queryByRole('button', { name: /use my photo/i })).not.toBeInTheDocument();
  });
});
