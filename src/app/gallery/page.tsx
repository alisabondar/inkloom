import Link from 'next/link';
import type { Metadata } from 'next';
import { HandNote } from '@/components/studio';
import { TemplateGrid } from '@/components/site/TemplateGrid';
import { listPublicTemplates } from '@/lib/db/queries';
import { MEDIUMS, type Medium } from '@/lib/plan';
import type { Difficulty } from '@/lib/processing';
import styles from '../pages.module.css';

export const metadata: Metadata = { title: 'Gallery' };

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

function hrefWith(current: { medium?: string; difficulty?: string }, change: { medium?: string; difficulty?: string }) {
  const next = { ...current, ...change };
  const params = new URLSearchParams(Object.entries(next).filter(([, value]) => value) as [string, string][]);
  const query = params.toString();
  return query ? `/gallery?${query}` : '/gallery';
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ medium?: string; difficulty?: string }> }) {
  const params = await searchParams;
  const medium = MEDIUMS.some((m) => m.id === params.medium) ? (params.medium as Medium) : undefined;
  const difficulty = DIFFICULTIES.includes(params.difficulty as Difficulty) ? (params.difficulty as Difficulty) : undefined;
  const templates = await listPublicTemplates({ medium, difficulty });
  const current = { medium, difficulty };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>The gallery</h1>
      <p className={styles.sub}>Templates people have shared from their studio tables.</p>

      <nav className={styles.filters} aria-label="Filter templates">
        <Link href={hrefWith(current, { medium: undefined })} className={`${styles.filter} ${!medium ? styles.filterActive : ''}`}>All mediums</Link>
        {MEDIUMS.map((m) => (
          <Link key={m.id} href={hrefWith(current, { medium: m.id })} className={`${styles.filter} ${medium === m.id ? styles.filterActive : ''}`}>{m.label}</Link>
        ))}
        <span className={styles.divider} aria-hidden="true">|</span>
        {DIFFICULTIES.map((d) => (
          <Link
            key={d}
            href={hrefWith(current, { difficulty: difficulty === d ? undefined : d })}
            className={`${styles.filter} ${difficulty === d ? styles.filterActive : ''}`}
            aria-pressed={difficulty === d}
          >
            {d}
          </Link>
        ))}
      </nav>

      {templates.length ? (
        <TemplateGrid templates={templates} />
      ) : (
        <HandNote>Nothing here yet for these filters — try another medium.</HandNote>
      )}
    </div>
  );
}
