'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MEDIUMS, type Medium } from '@/lib/plan';
import { startConceptsAction, type StartConceptsState } from '@/app/actions/generations';
import { useReferencePhotoAction } from '@/app/actions/uploads';
import { Button, Chip, HandNote, Paper, Wash } from '@/components/studio';
import { StepIndicator } from './StepIndicator';
import styles from './create.module.css';

const DETAILS = ['at golden hour', 'soft morning light', 'simple bold shapes', 'muted earthy palette', 'close-up view', 'wide landscape'];
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function conceptsUrl(state: StartConceptsState) {
  return `/create/concepts?batch=${encodeURIComponent(state.batchId ?? '')}&ids=${(state.generationIds ?? []).map(encodeURIComponent).join(',')}`;
}

export interface CreateFlowProps { initialMedium?: Medium | null; initialIdea?: string; initialTitle?: string }

export function CreateFlow({ initialMedium = null, initialIdea = '', initialTitle = '' }: CreateFlowProps) {
  const router = useRouter();
  const [medium, setMedium] = useState<Medium | null>(initialMedium);
  const [step, setStep] = useState<1 | 2>(initialMedium && initialIdea ? 2 : 1);
  const [idea, setIdea] = useState(initialIdea);
  const [title, setTitle] = useState(initialTitle);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const [conceptsState, startConcepts, conceptsPending] = useActionState(startConceptsAction, {} as StartConceptsState);
  const [photoState, dispatchPhoto, photoPending] = useActionState(useReferencePhotoAction, {} as StartConceptsState);
  const pending = conceptsPending || photoPending;

  useEffect(() => {
    const done = conceptsState.ok ? conceptsState : photoState.ok ? photoState : null;
    if (done?.batchId) router.push(conceptsUrl(done));
  }, [conceptsState, photoState, router]);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const serverState = photoState.error || photoState.fieldErrors ? photoState : conceptsState;
  const errors = { ...(serverState.fieldErrors ?? {}), ...localErrors };

  function choosePhoto(file: File | null) {
    const next = { ...localErrors };
    delete next.photo;
    if (file && !PHOTO_TYPES.includes(file.type)) next.photo = 'Use a JPG, PNG, WebP or GIF image';
    else if (file && file.size > MAX_PHOTO_BYTES) next.photo = 'Photos must be 8 MB or smaller';
    setLocalErrors(next);
    setPhoto(next.photo ? null : file);
    if (!file || next.photo) setPreview(null);
  }

  function baseForm() {
    const form = new FormData();
    form.set('medium', medium ?? '');
    form.set('idea', idea.trim());
    if (title.trim()) form.set('title', title.trim());
    return form;
  }

  function generate() {
    if (idea.trim().length < 3) {
      setLocalErrors({ ...localErrors, idea: 'Describe your idea in a few words (at least 3 characters)' });
      return;
    }
    const form = baseForm();
    startTransition(() => startConcepts(form));
  }

  function submitPhoto() {
    if (!photo) return;
    const form = baseForm();
    form.set('photo', photo);
    startTransition(() => dispatchPhoto(form));
  }

  const selected = MEDIUMS.find((m) => m.id === medium);

  return (
    <>
      <HandNote>let&apos;s make something</HandNote>
      <h1 className={styles.title}>{step === 1 ? 'What will you make it with?' : 'Describe your idea'}</h1>
      <StepIndicator current={step} />

      {step === 1 ? (
        <section aria-label="Choose a medium">
          <p className={styles.sub}>Pick a medium. We&apos;ll shape the concept and the template around it.</p>
          <div className={styles.mediums} role="radiogroup" aria-label="Medium">
            {MEDIUMS.map((m) => {
              const isSelected = m.id === medium;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={[styles.medium, isSelected && styles.mediumSelected].filter(Boolean).join(' ')}
                  onClick={() => setMedium(m.id)}
                >
                  {isSelected && <span className={styles.check} aria-hidden="true">✓</span>}
                  <p className={styles.mediumLabel}>{m.label}</p>
                  <p className={styles.mediumDesc}>{m.description}</p>
                  <span className={styles.outputs}>
                    {m.outputs.map((o) => <span key={o} className={styles.output}>{o.replace(/-/g, ' ')}</span>)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className={styles.actions}>
            <Button disabled={!medium} onClick={() => setStep(2)}>Next: describe it →</Button>
            {!medium && <HandNote rotate={-1}>choose one first</HandNote>}
          </div>
        </section>
      ) : (
        <section aria-label="Describe your idea" className={styles.composer}>
          <Paper tape rotate={-0.4} style={{ padding: '26px 24px', position: 'relative' }}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="create-idea">Your idea</label>
              <textarea
                id="create-idea"
                className={styles.textarea}
                value={idea}
                maxLength={1000}
                placeholder="A mountain valley with a winding river…"
                aria-invalid={Boolean(errors.idea)}
                aria-describedby={errors.idea ? 'create-idea-error' : undefined}
                onChange={(e) => {
                  setIdea(e.target.value);
                  if (localErrors.idea) setLocalErrors(({ idea: _drop, ...rest }) => rest);
                }}
              />
              {errors.idea && <p id="create-idea-error" className={styles.error} role="alert">{errors.idea}</p>}
              <div className={styles.chips} aria-label="Add detail">
                {DETAILS.map((d) => (
                  <Chip key={d} onClick={() => setIdea((prev) => (prev.trim() ? `${prev.trim().replace(/[.,]$/, '')}, ${d}` : d))}>
                    + {d}
                  </Chip>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="create-title">Title <small>(optional)</small></label>
              <input id="create-title" className={styles.input} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
              {errors.title && <p className={styles.error}>{errors.title}</p>}
            </div>
            {errors.medium && <p className={styles.error}>{errors.medium}</p>}
            {serverState.error && <p className={styles.error} role="alert">{serverState.error}</p>}
            <div className={styles.actions}>
              <Button variant="mint" onClick={generate} disabled={pending || !medium}>
                {conceptsPending ? 'Starting…' : 'Generate 4 concepts'}
              </Button>
              {photo && (
                <Button variant="paper" onClick={submitPhoto} disabled={pending || !medium}>
                  {photoPending ? 'Uploading…' : 'Use my photo as the concept'}
                </Button>
              )}
              <button type="button" className={styles.linkButton} onClick={() => setStep(1)}>
                ← {selected ? `${selected.label} · change medium` : 'Choose a medium'}
              </button>
            </div>
          </Paper>

          <Paper rotate={0.8} style={{ padding: '22px 20px', position: 'relative' }}>
            <Wash color="#9be6da" style={{ inset: '-10% -10% auto auto', width: 140, height: 100 }} opacity={0.45} />
            <div className={styles.photoBox}>
              <label className={styles.label} htmlFor="create-photo">Reference photo <small>(optional)</small></label>
              <HandNote rotate={-1.5}>use your own photo, or let us paint it</HandNote>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              {preview && <img src={preview} alt="Selected reference photo" className={styles.photoPreview} />}
              <input
                id="create-photo"
                type="file"
                accept={PHOTO_TYPES.join(',')}
                className={styles.fileInput}
                onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)}
              />
              {errors.photo && <p className={styles.error} role="alert">{errors.photo}</p>}
              <small>JPG, PNG, WebP or GIF, up to 8 MB.</small>
            </div>
          </Paper>
        </section>
      )}
    </>
  );
}
