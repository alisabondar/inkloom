import { headers } from 'next/headers';

// Absolute origin of the current request, for links in auth emails.
export async function getOrigin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocol = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

// Only allow redirects to paths on this site.
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = '/') {
  const text = typeof value === 'string' ? value : '';
  return text.startsWith('/') && !text.startsWith('//') ? text : fallback;
}
