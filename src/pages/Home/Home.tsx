import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import styles from "./Home.module.css";

export const HomePage = () => {
  return (
    <div className={styles.container}>
      <Header title="Homepage" />

      <main className={`${styles.main} ${styles.mainDark}`}>
        <div className={styles.mainContent}>
          <div className={styles.homeButtons}>
            <Link href="/template">
              <button className={styles.templateButton}>
                Create New Template
              </button>
            </Link>
            <Link href="/templates">
              <button className={`${styles.templateButton} ${styles.templateButtonSecondary}`}>
                View My Templates
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
