import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery - Inkloom',
  description: 'Browse example templates made by fellow artists',
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
