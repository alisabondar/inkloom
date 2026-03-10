import type { Metadata } from 'next';
import { Story_Script } from 'next/font/google';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FractalBackground } from '@/components/common/FractalBackground';
import '@/styles/globals.css';

const storyScript = Story_Script({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-story-script',
});

export const metadata: Metadata = {
  title: 'Inkloom',
  description: 'Art template creation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={storyScript.variable}>
      <body>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", width: "100%", position: "relative", overflow: "hidden" }}>
          <FractalBackground />
          <Header />
          <main style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, overflowY: "auto" }}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

