import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Gallery - Inkloom',
  description: 'Browse example templates made by fellow artists',
};

export default function GalleryPage() {
  return (
    <div className={styles.container}>
      <p className={styles.subtitle}>Browse example templates made by fellow artists</p>

      <section className={styles.examplesSection}>
        <div className={styles.examplesGrid}>
          <div className={styles.exampleCard}>
            <Image src="/cat.png" alt="Example template" width={450} height={450} />
          </div>
          <div className={styles.exampleCard}>
            <Image src="/meadow.png" alt="Example template" width={360} height={360} />
          </div>
          <div className={styles.exampleCard}>
            <Image src="/dog.png" alt="Example template" width={240} height={240} />
          </div>
        </div>
      </section>
    </div>
  );
}

