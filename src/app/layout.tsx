import type { Metadata } from 'next';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FractalBackground } from '@/components/common/FractalBackground';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Inkloom',
  description: 'Art template creation platform',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,600..850,45,1&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
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
