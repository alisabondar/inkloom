import Link from 'next/link';
import styles from './site.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} Inkloom · made on a studio table</span>
      <span><Link href="/gallery">Gallery</Link> · <Link href="/create">Start a piece</Link></span>
    </footer>
  );
}
