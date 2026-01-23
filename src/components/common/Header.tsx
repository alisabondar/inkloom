'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

export const Header = () => {
  const pathname = usePathname();

  // Get title from route or default
  const getTitle = () => {
    if (pathname === "/" || pathname === "") return "Inkloom";
    if (pathname.includes("create-template")) return "Create Template";
    if (pathname.includes("template-view")) return "Template View";
    if (pathname.includes("profile")) return "Profile";
    if (pathname.includes("gallery")) return "Templates";
    return "Inkloom";
  };

  const title = getTitle();

  return (
    <header className={`${styles.header} ${styles.headerDark}`}>
      <div className={styles.headerContent}>
        <h1 className={`${styles.headerTitle} ${styles.headerTitleDark}`}>
          {title}
        </h1>
        <Link href="/profile" className={styles.avatarLink}>
          <div className={styles.avatar}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                fill="currentColor"
              />
              <path
                d="M12 14C7.58172 14 4 16.6863 4 20V22H20V20C20 16.6863 16.4183 14 12 14Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </Link>
      </div>
    </header>
  );
};
