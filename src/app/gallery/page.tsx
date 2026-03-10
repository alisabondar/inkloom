'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { usePublicTemplates } from '@/hooks/usePublicTemplates';

export default function GalleryPage() {
  const { templates: publicTemplates, isLoading } = usePublicTemplates();

  return (
    <div className={styles.container}>
      <p className={`${styles.subtitle} beauFont`}>Browse example templates made by fellow artists</p>

      {isLoading ? (
        <div className={styles.galleryLoading}>
          <div className={styles.loadingSpinner} />
          <p className={`${styles.loadingText} beauFont`}>Loading gallery...</p>
        </div>
      ) : (
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
          {publicTemplates.map((t, i) => (
            <Link
              key={t.id}
              href={`/template-view?id=${t.id}`}
              className={styles.exampleCard}
              style={{ animationDelay: `${1.5 + i * 0.15}s` }}
            >
              {t.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.image_url}
                  alt={t.title || 'Template'}
                  className={styles.exampleCardImage}
                />
              ) : (
                <div className={styles.exampleCardPlaceholder}>
                  {t.title || 'Template'}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}

