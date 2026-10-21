import Link from 'next/link';
import { getCurrentProfile } from '@/lib/db/queries';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/studio';
import { NavLinks } from './NavLinks';
import styles from './site.module.css';

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const initial = (profile?.first_name || profile?.username || profile?.email || '?').charAt(0).toUpperCase();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>Inkloom</Link>
      <NavLinks signedIn={Boolean(profile)} />
      <div className={styles.spacer} />
      {profile ? (
        <div className={styles.account}>
          <form action={signOutAction}>
            <button type="submit" className={styles.signOut}>Sign out</button>
          </form>
          <Link href="/settings" className={styles.avatar} aria-label="Account settings">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initial}
          </Link>
        </div>
      ) : (
        <div className={styles.account}>
          <Link href="/signin" className={styles.navLink}>Sign in</Link>
          <Button href="/signup" size="sm">Join free</Button>
        </div>
      )}
    </header>
  );
}
