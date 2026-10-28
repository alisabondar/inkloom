'use client';
import type { ReactNode } from 'react';
import styles from './studio.module.css';

export interface LayerCardProps {
  label: string;
  thumbnail?: string | ReactNode;
  active: boolean;
  onToggle: () => void;
}

export function LayerCard({ label, thumbnail, active, onToggle }: LayerCardProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={[styles.layer, active && styles.layerActive].filter(Boolean).join(' ')}
    >
      <span className={styles.tick} aria-hidden="true">{active ? '✓' : ''}</span>
      <span className={styles.layerLabel}>{label}</span>
      {thumbnail !== undefined && (
        <span className={styles.layerThumb} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {typeof thumbnail === 'string' ? <img src={thumbnail} alt="" /> : thumbnail}
        </span>
      )}
    </button>
  );
}
