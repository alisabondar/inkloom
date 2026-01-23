import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import styles from "./templates.module.css";

export default function TemplatesPage() {
  return (
    <div className={styles.container}>
      <Header title="My Templates" />
      <main className={styles.main}>
        <div className={styles.content}>
          <p>Templates list page - Coming soon</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

