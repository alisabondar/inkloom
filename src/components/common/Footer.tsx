import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={`${styles.footer} ${styles.footerDark}`} role="contentinfo">
      <div className={styles.footerContent}>
        <p className={`${styles.footerText} ${styles.footerTextDark}`}>
          &copy; {new Date().getFullYear()} Inkloom. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
