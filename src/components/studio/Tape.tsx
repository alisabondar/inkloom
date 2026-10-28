import type { CSSProperties } from 'react';
import styles from './studio.module.css';

export interface TapeProps {
  className?: string;
  style?: CSSProperties;
  angle?: number;
  /** Tints the tape (washi tape); defaults to plain masking tape. */
  color?: string;
  size?: 'sm' | 'md';
}

export function Tape({ className, style, angle = -4, color, size = 'md' }: TapeProps) {
  return (
    <span
      aria-hidden="true"
      className={[styles.tape, size === 'sm' && styles.tapeSm, color && styles.tapeTinted, className].filter(Boolean).join(' ')}
      style={{ ['--studio-tape-angle' as string]: `${angle}deg`, ...(color ? { ['--studio-tape-color' as string]: color } : {}), ...style }}
    />
  );
}
