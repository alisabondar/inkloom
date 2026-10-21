import type { CSSProperties, ReactNode } from 'react';
import styles from './studio.module.css';
import { Tape } from './Tape';

export interface PaperProps {
  children?: ReactNode;
  rotate?: number;
  tape?: boolean;
  tooth?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article';
  style?: CSSProperties;
}

/** Off-white sheet with a warm layered shadow and optional paper tooth. */
export function Paper({ children, rotate = 0, tape = false, tooth = true, className, as: Tag = 'div', style }: PaperProps) {
  return (
    <Tag
      className={[styles.paper, className].filter(Boolean).join(' ')}
      style={{ ['--studio-r' as string]: `${rotate}deg`, ...style }}
    >
      {tooth && <span aria-hidden="true" className={`${styles.paperTooth} studio-tooth`} />}
      {tape && (
        <>
          <Tape className={styles.paperTapeLeft} angle={-6} />
          <Tape className={styles.paperTapeRight} angle={5} />
        </>
      )}
      <div className={styles.paperBody}>{children}</div>
    </Tag>
  );
}
