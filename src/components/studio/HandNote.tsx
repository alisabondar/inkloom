import type { CSSProperties, ReactNode } from 'react';
import styles from './studio.module.css';

export interface HandNoteProps { children: ReactNode; color?: string; className?: string; style?: CSSProperties }

// Handwritten-style note. Always level: text is never tilted.
export function HandNote({ children, color, className, style }: HandNoteProps) {
  return (
    <span
      className={[styles.hand, className].filter(Boolean).join(' ')}
      style={{ ...(color ? { color } : {}), ...style }}
    >
      {children}
    </span>
  );
}
