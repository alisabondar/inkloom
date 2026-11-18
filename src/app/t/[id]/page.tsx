import type { Metadata } from 'next';
import { getTemplateForViewer } from '@/lib/db/queries';
import { Workspace } from './Workspace';

// The tab shows the template's own title. A missing or private template falls through to the 404 page.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { template } = await getTemplateForViewer((await params).id);
  return { title: template.title };
}

// Private templates are hidden by RLS, so getTemplateForViewer 404s for anyone but the owner.
export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { template, isOwner, isGuest } = await getTemplateForViewer(id);
  return <Workspace template={template} isOwner={isOwner} isGuest={isGuest} />;
}
