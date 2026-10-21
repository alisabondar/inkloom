import { Button, HandNote, Paper } from '@/components/studio';
import styles from './pages.module.css';

export default function NotFound() {
  return (
    <div className={styles.narrow} style={{ textAlign: 'center' }}>
      <Paper tape rotate={-1.5}>
        <h1 className={styles.cardTitle}>This sheet isn&apos;t on the table</h1>
        <p className={styles.sub}>It may be private, deleted, or the link is off by a letter.</p>
        <Button href="/gallery">Browse the gallery</Button>
      </Paper>
      <HandNote rotate={2} style={{ display: 'block', marginTop: 16 }}>404 — lost under a pile of sketches</HandNote>
    </div>
  );
}
