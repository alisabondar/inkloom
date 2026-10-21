'use client';
import type { ButtonHTMLAttributes } from 'react';
import styles from './studio.module.css';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> { active?: boolean }

export function Chip({ active = false, className, children, type, ...rest }: ChipProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-pressed={active}
      className={[styles.chip, active && styles.chipActive, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
