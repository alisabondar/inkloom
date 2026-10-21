import Link from 'next/link';
import type { ButtonHTMLAttributes } from 'react';
import styles from './studio.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ink' | 'mint' | 'paper';
  size?: 'sm' | 'md';
  href?: string;
}

const variantClass = { ink: styles.ink, mint: styles.mint, paper: styles.paperVariant };

export function Button({ variant = 'ink', size = 'md', href, className, children, type, ...rest }: ButtonProps) {
  const cls = [styles.button, variantClass[variant], styles[size], className].filter(Boolean).join(' ');
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={rest['aria-label']} id={rest.id} style={rest.style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? 'button'} className={cls} {...rest}>
      {children}
    </button>
  );
}
