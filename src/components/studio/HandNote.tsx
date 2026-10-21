import type { CSSProperties, ReactNode } from 'react';
import styles from './studio.module.css';

export interface HandNoteProps { children: ReactNode; rotate?: number; color?: string; className?: string; style?: CSSProperties }

export function HandNote({ children, rotate = -2, color, className, style }: HandNoteProps) {
  return (
    <span
      className={[styles.hand, className].filter(Boolean).join(' ')}
      style={{ ['--studio-r' as string]: `${rotate}deg`, ...(color ? { color } : {}), ...style }}
    >
      {children}
    </span>
  );
}
