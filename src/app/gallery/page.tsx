import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates - Inkloom',
  description: 'Browse your templates',
};

export default function GalleryPage() {
  return (
    <div>
      <h1>Templates</h1>
      <p>Browse your templates</p>
    </div>
  );
}

