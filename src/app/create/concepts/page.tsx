import type { Metadata } from 'next';
import { getServerClient } from '@/lib/supabase/server';
import { StudioBackground, Paper, Button } from '@/components/studio';
import type { GenerationRow } from '@/lib/db/types';
import { SignInCard } from '../SignInCard';
import { ConceptsStage } from './ConceptsStage';
import styles from '../create.module.css';

export const metadata: Metadata = { title: 'Your concepts' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Search = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ConceptsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const batch = first(params.batch) ?? '';
  const ids = (first(params.ids) ?? '').split(',').filter((id) => UUID.test(id)).slice(0, 8);
  const { supabase, user } = await getServerClient();
  const next = `/create/concepts?batch=${encodeURIComponent(batch)}&ids=${ids.join(',')}`;

  let body;
  if (!user) {
    body = <SignInCard next={next} />;
  } else if (!ids.length) {
    body = (
      <Paper tape style={{ maxWidth: 480, margin: '48px auto', padding: '28px' }}>
        <h1 className={styles.title}>No concepts here</h1>
        <p className={styles.sub}>This link doesn&apos;t point to any concepts. Start a new idea instead.</p>
        <Button href="/create">Start creating</Button>
      </Paper>
    );
  } else {
    const { data } = await supabase
      .from('generations')
      .select('options')
      .in('id', ids)
      .limit(1)
      .maybeSingle<Pick<GenerationRow, 'options'>>();
    const options = data?.options;
    body = (
      <ConceptsStage
        ids={ids}
        idea={options?.idea ?? ''}
        medium={options?.medium ?? null}
        title={options?.title ?? ''}
      />
    );
  }

  return (
    <StudioBackground light>
      <main className={styles.page}>
        <div className={styles.inner}>{body}</div>
      </main>
    </StudioBackground>
  );
}
