'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { usePublicTemplates } from '@/hooks/usePublicTemplates';

export default function GalleryPage() {
  const { templates: publicTemplates, isLoading, error } = usePublicTemplates();

  return (
    <div className={styles.container}>
      <div className={styles.galleryHeader}>
        <h2 className={styles.title}>Browse templates made by fellow artists</h2>
      </div>

      {isLoading ? (
        <div className={styles.galleryLoading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading gallery...</p>
        </div>
      ) : (
      <section className={styles.examplesSection}>
        {error && (
          <p className={styles.galleryNotice}>
            Shared templates are taking a minute to load, so showing examples for now.
          </p>
        )}
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
              <div className={styles.templateOverlay}>
                <span>{t.title || 'Untitled template'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
