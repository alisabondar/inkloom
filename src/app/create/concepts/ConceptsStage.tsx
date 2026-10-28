'use client';

import { useEffect, useState } from 'react';
import { useFormAction } from '@/components/site/useFormAction';
import { saveTemplateAction } from '@/app/actions/templates';
import type { Difficulty } from '@/lib/processing';
import type { Medium } from '@/lib/plan';
import { Button, Chip, HandNote, Paper, Tape } from '@/components/studio';
import { StepIndicator } from '../StepIndicator';
import styles from '../create.module.css';

export type ConceptStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export interface Concept { id: string; status: ConceptStatus; error: string | null; imageUrl: string | null }

const POLL_MS = 2000;
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const TAPE_COLORS = ['#7fb9a8', '#d97b4a', '#e7b45c', '#9db7c9'];
const finished = (c: Concept) => c.status === 'succeeded' || c.status === 'failed';

export interface ConceptsStageProps { ids: string[]; idea: string; medium: Medium | null; title: string; pollMs?: number }

export function ConceptsStage({ ids, idea, medium, title, pollMs = POLL_MS }: ConceptsStageProps) {
  const [concepts, setConcepts] = useState<Concept[]>(() => ids.map((id) => ({ id, status: 'queued', error: null, imageUrl: null })));
  const [signedOut, setSignedOut] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = new Set<string>();

    async function poll() {
      const pending = ids.filter((id) => !done.has(id));
      const results = await Promise.all(
        pending.map(async (id): Promise<Concept | 'auth' | null> => {
          try {
            const res = await fetch(`/api/generations/${id}`, { cache: 'no-store' });
            if (res.status === 401) return 'auth';
            if (res.status === 404) return { id, status: 'failed', error: 'This concept could not be found', imageUrl: null };
            if (!res.ok) return null;
            const body = (await res.json()) as Concept;
            return { id, status: body.status, error: body.error, imageUrl: body.imageUrl };
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      if (results.includes('auth')) {
        setSignedOut(true);
        return;
      }
      const updates = results.filter((r): r is Concept => r !== null && r !== 'auth');
      updates.forEach((c) => finished(c) && done.add(c.id));
      setConcepts((prev) => prev.map((c) => updates.find((u) => u.id === c.id) ?? c));
      if (done.size < ids.length) timer = setTimeout(poll, pollMs);
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ids, pollMs]);

  const ready = concepts.filter((c) => c.status === 'succeeded').length;
  const failedCount = concepts.filter((c) => c.status === 'failed').length;
  const allDone = ready + failedCount === concepts.length;
  const allFailed = allDone && ready === 0;
  const selected = concepts.find((c) => c.id === selectedId && c.status === 'succeeded') ?? null;

  const retry = new URLSearchParams();
  if (medium) retry.set('medium', medium);
  if (idea) retry.set('idea', idea);
  if (title) retry.set('title', title);
  const retryHref = `/create${retry.size ? `?${retry}` : ''}`;

  if (signedOut) {
    return (
      <Paper tape style={{ maxWidth: 480, margin: '48px auto', padding: 28 }}>
        <h1 className={styles.title}>You&apos;ve been signed out</h1>
        <p className={styles.sub}>Sign in again to see your concepts. They keep painting in the meantime.</p>
        <Button href={`/signin?next=${encodeURIComponent(typeof window === 'undefined' ? '/create' : window.location.pathname + window.location.search)}`}>Sign in</Button>
      </Paper>
    );
  }

  const stages = [
    { label: 'Enhancing your idea', detail: 'Added lighting, composition and palette hints', state: 'done' as const },
    {
      label: 'Painting concepts',
      detail: `${ready} of ${concepts.length} ready${failedCount ? ` · ${failedCount} failed` : ''}`,
      state: allDone ? ('done' as const) : ('active' as const),
    },
    { label: 'Ready to choose', detail: allFailed ? 'Nothing to choose this time' : 'Pick the one you like best', state: allDone && !allFailed ? ('done' as const) : ('todo' as const) },
  ];

  return (
    <>
      <HandNote>{allDone ? 'take your pick' : 'working on it…'}</HandNote>
      <h1 className={styles.title}>{idea || 'Your concepts'}</h1>
      <StepIndicator current={3} />
      <div className={styles.stage}>
        <Paper style={{ padding: '22px 20px', position: 'relative' }}>
          <h2 className={styles.label}>Progress</h2>
          <ol className={styles.stageList} aria-live="polite">
            {stages.map((s) => (
              <li
                key={s.label}
                className={[styles.stageItem, s.state === 'done' && styles.stageDone, s.state === 'active' && styles.stageActive].filter(Boolean).join(' ')}
              >
                <span className={styles.stageMark} aria-hidden="true">{s.state === 'done' ? '✓' : s.state === 'active' ? '◌' : '·'}</span>
                <span>
                  <strong>{s.label}</strong>
                  <small>{s.detail}</small>
                </span>
              </li>
            ))}
          </ol>
          {!allDone && <p className={styles.notice}>You can leave this page. We&apos;ll keep painting and your concepts will be waiting.</p>}
          {allFailed && (
            <>
              <p className={styles.error}>None of the concepts could be painted.</p>
              <div className={styles.actions}><Button href={retryHref}>Try again</Button></div>
            </>
          )}
          {allDone && !allFailed && (
            <p className={styles.notice}>
              Not quite right? <a href={retryHref}>Edit the idea</a>
            </p>
          )}
        </Paper>

        <div>
          <ul className={styles.grid} aria-label="Concepts" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {concepts.map((c, i) => (
              <li key={c.id} data-status={c.status}>
                <ConceptSlot concept={c} index={i} selected={c.id === selectedId} onSelect={() => setSelectedId(c.id)} />
              </li>
            ))}
          </ul>
          {selected && <SavePanel key={selected.id} generationId={selected.id} defaultTitle={title || idea.slice(0, 120)} />}
        </div>
      </div>
    </>
  );
}

function ConceptSlot({ concept, index, selected, onSelect }: { concept: Concept; index: number; selected: boolean; onSelect: () => void }) {
  const label = `Concept ${index + 1}`;
  if (concept.status === 'succeeded' && concept.imageUrl) {
    return (
      <button
        type="button"
        className={[styles.slot, selected && styles.slotSelected].filter(Boolean).join(' ')}
        aria-pressed={selected}
        aria-label={`${label}${selected ? ' (selected)' : ''}`}
        onClick={onSelect}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        <img src={concept.imageUrl} alt="" />
        <span className={styles.slotLabel}>{selected ? `✓ ${label}` : label}</span>
      </button>
    );
  }
  if (concept.status === 'failed' || concept.status === 'succeeded') {
    return (
      <div className={styles.slot} role="group" aria-label={`${label} failed`}>
        <div className={styles.failed}>
          <strong>This one didn&apos;t take</strong>
          {concept.error || 'The image could not be loaded'}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.slot} role="group" aria-label={`${label} ${concept.status === 'running' ? 'painting' : 'waiting'}`} aria-busy="true">
      <span className={styles.tapes} aria-hidden="true">
        <Tape size="sm" color={TAPE_COLORS[index % TAPE_COLORS.length]} angle={-8} />
        <Tape size="sm" color={TAPE_COLORS[(index + 1) % TAPE_COLORS.length]} angle={6} />
      </span>
      <span className={styles.waiting}>{concept.status === 'running' ? 'painting…' : 'in the queue…'}</span>
    </div>
  );
}

function SavePanel({ generationId, defaultTitle }: { generationId: string; defaultTitle: string }) {
  const [state, formAction, pending] = useFormAction(saveTemplateAction);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');

  return (
    <Paper tape className={styles.panel} style={{ padding: '24px 22px' }}>
      <form action={formAction} aria-label="Use this concept">
        <input type="hidden" name="generationId" value={generationId} />
        <input type="hidden" name="difficulty" value={difficulty} />
        <div className={styles.panelGrid}>
          <div>
            <label className={styles.label} htmlFor="concept-title">Title</label>
            <input id="concept-title" name="title" className={styles.input} defaultValue={state.values?.title ?? defaultTitle} maxLength={120} required />
            {state.fieldErrors?.title && <p className={styles.error}>{state.fieldErrors.title}</p>}
          </div>
          <div>
            <span className={styles.label} id="concept-difficulty">Difficulty</span>
            <div className={styles.chips} role="group" aria-labelledby="concept-difficulty">
              {DIFFICULTIES.map((d) => (
                <Chip key={d} active={d === difficulty} onClick={() => setDifficulty(d)}>{d}</Chip>
              ))}
            </div>
          </div>
        </div>
        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
        <div className={styles.actions}>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Use this concept →'}</Button>
        </div>
      </form>
    </Paper>
  );
}
