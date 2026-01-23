'use client';

import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Create Beautiful Templates
            </h1>
            <p className={styles.heroSubtitle}>
              Design and customize stunning templates for your creative projects
            </p>
            <div className={styles.homeButtons}>
              <Link href="/create-template">
                <button className={styles.templateButton}>
                  Create New Template
                </button>
              </Link>
              <Link href="/gallery">
                <button className={`${styles.templateButton} ${styles.templateButtonSecondary}`}>
                  Gallery
                </button>
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.decorativeCircle}></div>
            <div className={styles.decorativeCircle}></div>
            <div className={styles.decorativeCircle}></div>
          </div>
        </div>
      </main>
    </div>
  );
}
