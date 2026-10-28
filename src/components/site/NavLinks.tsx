'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './site.module.css';

const LINKS = [
  { href: '/create', label: 'Create' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/projects', label: 'My projects', signedInOnly: true },
];

export function NavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Main">
      {LINKS.filter((link) => signedIn || !link.signedInOnly).map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
