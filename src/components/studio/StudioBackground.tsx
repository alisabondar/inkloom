import type { ReactNode } from 'react';
import styles from './studio.module.css';

export interface StudioBackgroundProps { children?: ReactNode; light?: boolean; className?: string }

/** Desk paper-grain backdrop with optional soft-light window stripes. */
export function StudioBackground({ children, light = false, className }: StudioBackgroundProps) {
  return (
    <div className={[styles.background, className].filter(Boolean).join(' ')}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="studio-wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={3} />
        </filter>
      </svg>
      <div className={styles.backgroundContent}>{children}</div>
      {light && <div className={styles.light} aria-hidden="true" />}
    </div>
  );
}
