import styles from './create.module.css';

const STEPS = ['Medium', 'Idea', 'Concepts', 'Template'];

export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className={styles.steps} aria-label="Progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const cls = n === current ? styles.stepCurrent : n < current ? styles.stepDone : undefined;
        return (
          <li key={label} className={cls} aria-current={n === current ? 'step' : undefined}>
            <span className={styles.stepNum}>{n < current ? '✓' : n}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
