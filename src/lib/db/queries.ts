import { notFound } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { signStoragePath } from '@/lib/supabase/admin';
import type { Difficulty } from '@/lib/processing';
import type { Medium } from '@/lib/plan';
import type { ProfileRow, PublicProfileRow, TemplateRow } from './types';

export interface TemplateCard extends TemplateRow {
  conceptUrl: string | null;
  makerUsername: string | null;
}

export interface CurrentProfile extends ProfileRow {
  avatarUrl: string | null;
}

// Signs concept images and attaches maker usernames. Rows were already authorized by RLS.
async function toCards(rows: TemplateRow[]): Promise<TemplateCard[]> {
  if (!rows.length) return [];
  const { supabase } = await getServerClient();
  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
  const { data: makers } = await supabase.from('public_profiles').select('id, username').in('id', ownerIds).returns<PublicProfileRow[]>();
  const usernames = new Map((makers ?? []).map((maker) => [maker.id, maker.username]));

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      conceptUrl: await signStoragePath('templates', row.concept_path),
      makerUsername: usernames.get(row.owner_id) ?? null,
    })),
  );
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const { supabase, user } = await getServerClient();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<ProfileRow>();
  if (!data) return null;
  return { ...data, avatarUrl: await signStoragePath('avatars', data.avatar_path) };
}

// A template the current viewer may see (their own, or a public one). Anything else is a 404.
export async function getTemplateForViewer(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await getServerClient();
  const { data } = await supabase.from('templates').select('*').eq('id', id).maybeSingle<TemplateRow>();
  if (!data) notFound();
  const [card] = await toCards([data]);
  return { template: card, isOwner: user?.id === data.owner_id };
}

export async function listPublicTemplates(filters: { medium?: Medium; difficulty?: Difficulty; limit?: number } = {}) {
  const { supabase } = await getServerClient();
  let query = supabase.from('templates').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(filters.limit ?? 60);
  if (filters.medium) query = query.eq('medium', filters.medium);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  const { data } = await query.returns<TemplateRow[]>();
  return toCards(data ?? []);
}

export async function listMyTemplates() {
  const { supabase, user } = await getServerClient();
  if (!user) return [];
  const { data } = await supabase.from('templates').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }).returns<TemplateRow[]>();
  return toCards(data ?? []);
}
