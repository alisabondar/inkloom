'use client';
import { useId } from 'react';
import styles from './studio.module.css';

export interface StepperProps {
  label: string;
  /** The allowed values, in order. */
  options: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  id?: string;
}

/** − value + control for small exact counts. Large tap targets; arrow keys also work. */
export function Stepper({ label, options, value, onChange, format = String, id }: StepperProps) {
  const autoId = useId();
  const labelId = id ?? `stepper-${autoId}`;
  const exact = options.indexOf(value);
  const index = exact >= 0 ? exact : options.reduce((best, v, i) => (Math.abs(v - value) < Math.abs(options[best] - value) ? i : best), 0);
  const go = (delta: number) => {
    const next = Math.min(options.length - 1, Math.max(0, index + delta));
    if (next !== index) onChange(options[next]);
  };

  return (
    <div className={styles.stepperRow}>
      <span id={labelId} className={styles.stepperLabel}>{label}</span>
      <div
        className={styles.stepper}
        role="group"
        aria-labelledby={labelId}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); go(1); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); go(-1); }
        }}
      >
        <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label={`Decrease ${label.toLowerCase()}`}>−</button>
        <output aria-live="polite">{format(options[index])}</output>
        <button type="button" onClick={() => go(1)} disabled={index === options.length - 1} aria-label={`Increase ${label.toLowerCase()}`}>+</button>
      </div>
    </div>
  );
}
