import styles from "../styles/Home.module.css";

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  return (
    <header className={`${styles.header} ${styles.headerDark}`}>
      <div className={styles.headerContent}>
        <h1 className={`${styles.headerTitle} ${styles.headerTitleDark}`}>
          {title}
        </h1>
      </div>
    </header>
  );
};
