import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Paper } from '@/components/studio';
import { NewPasswordForm } from '@/components/site/AuthForms';
import { getServerClient } from '@/lib/supabase/server';
import styles from '../../pages.module.css';

export const metadata: Metadata = { title: 'Choose a new password' };

// Reached from the password-reset email after /auth/callback has signed the user in.
export default async function NewPasswordPage() {
  const { user } = await getServerClient();
  if (!user) redirect('/signin?error=link');

  return (
    <div className={styles.narrow}>
      <Paper tape rotate={-0.6}>
        <h1 className={styles.cardTitle}>Choose a new password</h1>
        <p className={styles.sub}>For {user.email}.</p>
        <NewPasswordForm />
      </Paper>
    </div>
  );
}
