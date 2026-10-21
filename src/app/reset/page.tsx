import Link from 'next/link';
import type { Metadata } from 'next';
import { Paper } from '@/components/studio';
import { ResetRequestForm } from '@/components/site/AuthForms';
import styles from '../pages.module.css';

export const metadata: Metadata = { title: 'Reset password' };

export default function ResetPage() {
  return (
    <div className={styles.narrow}>
      <Paper tape rotate={-0.6}>
        <h1 className={styles.cardTitle}>Forgot your password?</h1>
        <p className={styles.sub}>We&apos;ll email you a link to choose a new one.</p>
        <ResetRequestForm />
        <p className={styles.muted} style={{ marginTop: 18 }}><Link href="/signin" className={styles.link}>Back to sign in</Link></p>
      </Paper>
    </div>
  );
}
