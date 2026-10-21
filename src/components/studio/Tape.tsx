import type { CSSProperties } from 'react';
import styles from './studio.module.css';

export interface TapeProps { className?: string; style?: CSSProperties; angle?: number }

export function Tape({ className, style, angle = -4 }: TapeProps) {
  return (
    <span
      aria-hidden="true"
      className={[styles.tape, className].filter(Boolean).join(' ')}
      style={{ ['--studio-tape-angle' as string]: `${angle}deg`, ...style }}
    />
  );
}
