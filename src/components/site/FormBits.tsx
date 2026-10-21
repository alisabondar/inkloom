import type { InputHTMLAttributes } from 'react';
import type { FormState } from './useFormAction';
import styles from '@/app/pages.module.css';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  state?: FormState;
}

export function Field({ label, name, state, id, defaultValue, ...input }: FieldProps) {
  const fieldId = id ?? `field-${name}`;
  const error = state?.fieldErrors?.[name];
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>{label}</label>
      <input
        id={fieldId}
        name={name}
        className={styles.input}
        defaultValue={input.type === 'file' ? undefined : state?.values?.[name] ?? defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...input}
      />
      {error && <span id={`${fieldId}-error`} className={styles.fieldError}>{error}</span>}
    </div>
  );
}

export function FormStatus({ state }: { state: FormState }) {
  if (state.error) return <div role="alert" className={styles.formError}>{state.error}</div>;
  if (state.message) return <div role="status" className={styles.formMessage}>{state.message}</div>;
  return null;
}
