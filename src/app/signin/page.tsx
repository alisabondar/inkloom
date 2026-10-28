import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { HandNote, Paper } from '@/components/studio';
import { SignInForm } from '@/components/site/AuthForms';
import { getServerClient } from '@/lib/supabase/server';
import { safeNext } from '@/app/actions/request';
import styles from '../pages.module.css';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const { user } = await getServerClient();
  if (user) redirect(next);

  return (
    <div className={styles.narrow}>
      <Paper tape>
        <h1 className={styles.cardTitle}>Welcome back</h1>
        <p className={styles.sub}>Pick up where you left off.</p>
        {params.error === 'link' && <p className={styles.formError}>That link has expired or was already used. Sign in, or request a new one.</p>}
        <SignInForm next={next} />
        <p className={styles.muted} style={{ marginTop: 18 }}>
          New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className={styles.link}>Create an account</Link>
        </p>
      </Paper>
      <HandNote style={{ display: 'block', marginTop: 18, textAlign: 'center' }}>your table is right where you left it</HandNote>
    </div>
  );
}
