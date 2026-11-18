'use client';
import { useEffect, useRef, type InputHTMLAttributes } from 'react';
import type { FormState } from './useFormAction';
import styles from '@/app/pages.module.css';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  state?: FormState;
  /** Shown under the field before anything goes wrong, e.g. "At least 8 characters". */
  hint?: string;
}

export function Field({ label, name, state, hint, id, defaultValue, ...input }: FieldProps) {
  const fieldId = id ?? `field-${name}`;
  const error = state?.fieldErrors?.[name];
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>{label}</label>
      <input
        id={fieldId}
        name={name}
        className={styles.input}
        defaultValue={input.type === 'file' ? undefined : state?.values?.[name] ?? defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...input}
      />
      {hint && !error && <span id={`${fieldId}-hint`} className={styles.hint}>{hint}</span>}
      {error && <span id={`${fieldId}-error`} className={styles.fieldError}>{error}</span>}
    </div>
  );
}

/**
 * The form's overall message. After a failed submit it also moves focus to the first field with
 * an error (or to the message itself), so keyboard and screen-reader users land on the problem.
 */
export function FormStatus({ state }: { state: FormState }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const form = anchor.current?.closest('form');
    const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid) invalid.focus();
    else if (state.error) alert.current?.focus();
  }, [state]);

  return (
    <>
      <span ref={anchor} hidden />
      {state.error && <div ref={alert} tabIndex={-1} role="alert" className={styles.formError}>{state.error}</div>}
      {!state.error && state.message && <div role="status" className={styles.formMessage}>{state.message}</div>}
    </>
  );
}
