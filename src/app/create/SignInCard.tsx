import { Button, HandNote, Paper } from '@/components/studio';
import styles from './create.module.css';

export function SignInCard({ next }: { next: string }) {
  return (
    <Paper tape style={{ maxWidth: 480, margin: '48px auto', padding: '32px 28px' }}>
      <HandNote>almost there!</HandNote>
      <h1 className={styles.title}>Sign in to start creating</h1>
      <p className={styles.sub}>Your concepts and templates are saved to your projects, so we need to know who you are first.</p>
      <Button href={`/signin?next=${encodeURIComponent(next)}`}>Sign in</Button>
    </Paper>
  );
}
