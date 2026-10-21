import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/actions/templates', () => ({ saveTemplateAction: vi.fn(async () => ({})) }));

import { ConceptsStage } from '../concepts/ConceptsStage';

const IDS = ['a', 'b', 'c', 'd'];

function mockFetch(byId: Record<string, object>) {
  const fn = vi.fn(async (url: string) => {
    const id = url.split('/').pop()!;
    return { ok: true, status: 200, json: async () => ({ id, batchId: 'x', error: null, imageUrl: null, ...byId[id] }) };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ConceptsStage', () => {
  it('renders each status and the painting progress', async () => {
    mockFetch({
      a: { status: 'succeeded', imageUrl: 'https://img/a.png' },
      b: { status: 'running' },
      c: { status: 'queued' },
      d: { status: 'failed', error: 'Provider timed out' },
    });
    render(<ConceptsStage ids={IDS} idea="Mountain valley" medium="watercolor" title="" pollMs={10_000} />);
    expect(await screen.findByRole('button', { name: 'Concept 1' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /concept 2 painting/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /concept 3 waiting/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /concept 4 failed/i })).toHaveTextContent('Provider timed out');
    expect(screen.getByText(/1 of 4 ready · 1 failed/)).toBeInTheDocument();
    expect(screen.getByText(/you can leave this page/i)).toBeInTheDocument();
  });

  it('polls until all finish, then lets the user pick a concept', async () => {
    let round = 0;
    const fn = vi.fn(async (url: string) => {
      const id = url.split('/').pop()!;
      const status = round > 0 ? 'succeeded' : 'running';
      return { ok: true, status: 200, json: async () => ({ id, status, error: null, imageUrl: status === 'succeeded' ? `https://img/${id}` : null }) };
    });
    vi.stubGlobal('fetch', fn);
    render(<ConceptsStage ids={['a', 'b']} idea="Fox in snow" medium="pencil" title="" pollMs={20} />);
    await screen.findByText(/0 of 2 ready/);
    round = 1;
    fireEvent.click(await screen.findByRole('button', { name: 'Concept 2' }));
    expect(screen.getByText(/2 of 2 ready/)).toBeInTheDocument();
    const callsAtDone = fn.mock.calls.length;
    await new Promise((r) => setTimeout(r, 80));
    expect(fn.mock.calls.length).toBe(callsAtDone);

    const form = screen.getByRole('form', { name: /use this concept/i });
    expect(within(form).getByLabelText('Title')).toHaveValue('Fox in snow');
    const advanced = within(form).getByRole('button', { name: 'advanced' });
    fireEvent.click(advanced);
    expect(advanced).toHaveAttribute('aria-pressed', 'true');
    expect(within(form).getByRole('button', { name: /use this concept/i })).toBeInTheDocument();
  });

  it('offers Try again when everything failed', async () => {
    mockFetch(Object.fromEntries(IDS.map((id) => [id, { status: 'failed', error: 'Nope' }])));
    render(<ConceptsStage ids={IDS} idea="Lighthouse" medium="acrylic" title="" pollMs={10_000} />);
    const retry = await screen.findByRole('link', { name: /try again/i });
    expect(retry).toHaveAttribute('href', '/create?medium=acrylic&idea=Lighthouse');
  });
});
