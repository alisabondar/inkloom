'use client';
import styles from './studio.module.css';

export interface PaintTinProps {
  colors: { hex: string; name: string }[];
  label?: string;
  onSelect?: (hex: string) => void;
}

export function PaintTin({ colors, label, onSelect }: PaintTinProps) {
  return (
    <div className={styles.tin} role="group" aria-label={label ?? 'Palette'}>
      <div className={styles.pans}>
        {colors.map((c) => (
          <button
            key={`${c.hex}-${c.name}`}
            type="button"
            className={styles.pan}
            aria-label={c.name}
            title={`${c.name} ${c.hex}`}
            style={{ ['--c' as string]: c.hex }}
            onClick={() => onSelect?.(c.hex)}
          />
        ))}
      </div>
      {label && <div className={styles.tinLabel}>{label}</div>}
    </div>
  );
}
