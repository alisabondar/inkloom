'use client';
import { useId } from 'react';
import styles from './studio.module.css';

export interface PencilSliderProps {
  label: string;
  valueLabel?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  id?: string;
}

/** Accessible range input drawn as a wobbly pencil line with a paint-splat handle. */
export function PencilSlider({ label, valueLabel, min, max, step = 1, value, onChange, color, id }: PencilSliderProps) {
  const autoId = useId();
  const inputId = id ?? `pencil-${autoId}`;
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  return (
    <div className={styles.slider}>
      <div className={styles.sliderLabel}>
        <label htmlFor={inputId}>{label}</label>
        <i className={styles.sliderValue} aria-hidden="true">{valueLabel ?? value}</i>
      </div>
      <div className={styles.sliderTrack}>
        <svg className={styles.sliderLine} viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
          <path d="M1 7 C 30 5, 52 9, 80 7 S 140 5, 168 8 S 192 6, 199 7" />
        </svg>
        <input
          id={inputId}
          type="range"
          className={styles.range}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueLabel}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span
          aria-hidden="true"
          className={styles.dab}
          style={{ left: `${pct}%`, ...(color ? { ['--studio-dab' as string]: color } : {}) }}
        />
      </div>
    </div>
  );
}
