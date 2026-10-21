import type { Metadata } from 'next';
import { StudioBackground } from '@/components/studio';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import styles from '@/components/site/site.module.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'Inkloom — templates for your next piece', template: '%s · Inkloom' },
  description: 'Turn an idea into line art, a value study, a palette, and a step-by-step plan.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Inter:wght@400;500;600;700;800&family=Caveat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <StudioBackground light>
          <SiteHeader />
          <main className={styles.main}>{children}</main>
          <SiteFooter />
        </StudioBackground>
      </body>
    </html>
  );
}
