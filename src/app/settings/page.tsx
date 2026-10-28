import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Paper } from '@/components/studio';
import { getCurrentProfile } from '@/lib/db/queries';
import { AvatarForm, DataControls, PasswordForm, ProfileForm } from './SettingsForms';
import styles from '../pages.module.css';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/signin?next=/settings');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.sub}>Your profile, sign-in, and data.</p>
      <div className={styles.settings}>
        <Paper>
          <h2 className={styles.cardTitle}>Profile</h2>
          <ProfileForm profile={profile} />
        </Paper>
        <div style={{ display: 'grid', gap: 26 }}>
          <Paper>
            <h2 className={styles.cardTitle}>Avatar</h2>
            <AvatarForm profile={profile} />
          </Paper>
          <Paper>
            <h2 className={styles.cardTitle}>Password</h2>
            <PasswordForm />
          </Paper>
        </div>
        <Paper>
          <h2 className={styles.cardTitle}>Your data</h2>
          <DataControls />
        </Paper>
      </div>
    </div>
  );
}
