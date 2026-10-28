'use client';
import { PencilSlider } from './PencilSlider';
import styles from './studio.module.css';

export interface SnapStop { value: number; label: string }

export interface SnapSliderProps {
  label: string;
  stops: SnapStop[];
  value: number;
  onChange: (v: number) => void;
  color?: string;
  id?: string;
}

/** Index of the stop closest to `value` (saved values between stops show at the nearest one). */
export function nearestStop(stops: SnapStop[], value: number) {
  let best = 0;
  stops.forEach((stop, i) => {
    if (Math.abs(stop.value - value) < Math.abs(stops[best].value - value)) best = i;
  });
  return best;
}

/** A pencil slider that only lands on named stops, with the stop names written under the track. */
export function SnapSlider({ label, stops, value, onChange, color, id }: SnapSliderProps) {
  const index = nearestStop(stops, value);
  return (
    <div className={styles.snap}>
      <PencilSlider
        id={id}
        label={label}
        min={0}
        max={stops.length - 1}
        step={1}
        value={index}
        valueLabel={stops[index].label}
        onChange={(i) => onChange(stops[i].value)}
        color={color}
      />
      <div className={styles.snapStops} aria-hidden="true">
        {stops.map((stop, i) => (
          <span key={stop.label} className={i === index ? styles.snapStopActive : undefined}>{stop.label}</span>
        ))}
      </div>
    </div>
  );
}
