import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Paper } from '@/components/studio';
import { SignUpForm } from '@/components/site/AuthForms';
import { getServerClient } from '@/lib/supabase/server';
import { safeNext } from '@/app/actions/request';
import styles from '../pages.module.css';

export const metadata: Metadata = { title: 'Create an account' };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next, '/create');
  const { user } = await getServerClient();
  if (user) redirect(next);

  return (
    <div className={styles.narrow}>
      <Paper tape rotate={0.8}>
        <h1 className={styles.cardTitle}>Pull up a chair</h1>
        <p className={styles.sub}>Free account — save templates, share to the gallery, track your projects.</p>
        <SignUpForm next={next} />
        <p className={styles.muted} style={{ marginTop: 18 }}>
          Already have an account? <Link href={`/signin?next=${encodeURIComponent(next)}`} className={styles.link}>Sign in</Link>
        </p>
      </Paper>
    </div>
  );
}
