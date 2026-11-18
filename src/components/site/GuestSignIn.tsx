import { guestSignInAction } from '@/app/actions/auth';
import { Button } from '@/components/studio';
import { isDemoEnabled } from '@/lib/supabase/demo';

/** "Try it as a guest": shown only when the shared demo account is configured. */
export function GuestSignIn({ next = '/create', note = 'No sign-up: use a shared guest account. Your work stays private.' }: { next?: string; note?: string }) {
  if (!isDemoEnabled()) return null;
  return (
    <form action={guestSignInAction} style={{ marginTop: 14 }}>
      <input type="hidden" name="next" value={next} />
      <Button type="submit" variant="paper">Try it as a guest</Button>
      {note && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--studio-muted)' }}>{note}</p>}
    </form>
  );
}
