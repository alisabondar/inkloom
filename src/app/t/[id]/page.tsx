import type { Metadata } from 'next';
import { getTemplateForViewer } from '@/lib/db/queries';
import { Workspace } from './Workspace';

export const metadata: Metadata = { title: 'Workspace · Inkloom' };

// Private templates are hidden by RLS, so getTemplateForViewer 404s for anyone but the owner.
export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { template, isOwner } = await getTemplateForViewer(id);
  return <Workspace template={template} isOwner={isOwner} />;
}
