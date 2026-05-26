'use client';

import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <p className={styles.kicker}>AI template studio for artists</p>
            <h1 className={styles.heroTitle}>
              Inkloom
            </h1>
            <p className={styles.heroSubtitle}>
              Turn a creative idea into a clean reference template, then bring it into color without needing a hand sketch.
            </p>
            <div className={styles.homeButtons}>
              <Link href="/create-template" className={styles.templateButton}>
                Create Template
              </Link>
              <Link href="/gallery" className={`${styles.templateButton} ${styles.templateButtonSecondary}`}>
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
