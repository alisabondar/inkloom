import styles from "../styles/Home.module.css";

export const Footer = () => {
  return (
    <footer className={`${styles.footer} ${styles.footerDark}`}>
      <div className={styles.footerContent}>
        <p className={`${styles.footerText} ${styles.footerTextDark}`}>
          © 2024 Your Company. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
