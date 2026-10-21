import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Button, HandNote, Paper } from '@/components/studio';
import { TemplateGrid } from '@/components/site/TemplateGrid';
import { getServerClient } from '@/lib/supabase/server';
import { listMyTemplates } from '@/lib/db/queries';
import styles from '../pages.module.css';

export const metadata: Metadata = { title: 'My projects' };

export default async function ProjectsPage() {
  const { user } = await getServerClient();
  if (!user) redirect('/signin?next=/projects');

  const templates = await listMyTemplates();

  return (
    <div className={styles.page}>
      <div className={styles.row} style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className={styles.title}>My projects</h1>
          <p className={styles.sub}>Everything on your table, newest first.</p>
        </div>
        <Button href="/create">Start a piece →</Button>
      </div>

      {templates.length ? (
        <TemplateGrid templates={templates} showPrivacy />
      ) : (
        <Paper rotate={-1} style={{ maxWidth: 460, margin: '30px auto', textAlign: 'center' }}>
          <h2 className={styles.cardTitle}>Your table is clear</h2>
          <p className={styles.sub}>Describe an idea and your first template will land here.</p>
          <Button href="/create" variant="mint">Create a template</Button>
          <HandNote style={{ display: 'block', marginTop: 12 }}>takes about a minute ✎</HandNote>
        </Paper>
      )}
    </div>
  );
}
