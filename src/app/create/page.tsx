import type { Metadata } from 'next';
import { getServerClient } from '@/lib/supabase/server';
import { MEDIUMS, type Medium } from '@/lib/plan';
import { StudioBackground } from '@/components/studio';
import { CreateFlow } from './CreateFlow';
import { SignInCard } from './SignInCard';
import styles from './create.module.css';

export const metadata: Metadata = { title: 'Create' };

type Search = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CreatePage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const { user } = await getServerClient();
  const mediumParam = first(params.medium);
  const medium = MEDIUMS.some((m) => m.id === mediumParam) ? (mediumParam as Medium) : null;

  return (
    <StudioBackground light>
      <main className={styles.page}>
        <div className={styles.inner}>
          {user ? (
            <CreateFlow
              initialMedium={medium}
              initialIdea={first(params.idea)?.slice(0, 1000) ?? ''}
              initialTitle={first(params.title)?.slice(0, 120) ?? ''}
            />
          ) : (
            <SignInCard next="/create" />
          )}
        </div>
      </main>
    </StudioBackground>
  );
}
