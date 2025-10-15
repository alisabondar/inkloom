import styles from "../styles/Home.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${styles.headerDark}`}>
        <div className={styles.headerContent}>
          <h1 className={`${styles.headerTitle} ${styles.headerTitleDark}`}>
            Homepage
          </h1>
        </div>
      </header>

      <main className={`${styles.main} ${styles.mainDark}`}>
        <div className={styles.mainContent}>
          <Link href="/template">
            <button className={styles.templateButton}>
              Template Form
            </button>
          </Link>
        </div>
      </main>

      <footer className={`${styles.footer} ${styles.footerDark}`}>
        <div className={styles.footerContent}>
          <p className={`${styles.footerText} ${styles.footerTextDark}`}>
            © 2024 Your Company. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
