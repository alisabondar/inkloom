import styles from "./Footer.module.css";

const COPYRIGHT_YEAR = 2026;

export const Footer = () => {
  return (
    <footer className={`${styles.footer} ${styles.footerDark}`} role="contentinfo">
      <div className={styles.footerContent}>
        <p className={`${styles.footerText} ${styles.footerTextDark}`}>
          &copy; {COPYRIGHT_YEAR} Inkloom. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
