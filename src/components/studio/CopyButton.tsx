'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './studio.module.css';

export interface CopyButtonProps {
  /** The text put on the clipboard. */
  text: string;
  /** Says what is copied, for screen readers and the tooltip, e.g. "Copy DMC 762". */
  label: string;
  children?: ReactNode;
  className?: string;
}

/** Copies `text` with one click and says so in place for a moment (no toast needed). */
export function CopyButton({ text, label, children = 'copy', className }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1600);
  };

  return (
    <button type="button" className={[styles.copy, className].filter(Boolean).join(' ')} onClick={copy} title={label} aria-label={label} data-state={state}>
      <span aria-hidden="true">{state === 'copied' ? 'copied ✓' : state === 'failed' ? "couldn't copy" : children}</span>
      <span className={styles.srOnly} role="status">{state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : ''}</span>
    </button>
  );
}
