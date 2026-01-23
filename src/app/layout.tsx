import type { Metadata } from 'next';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import '@/styles/globals.css';

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
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", background: "transparent", position: "relative" }}>
          <Header />
          <main style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", background: "transparent", position: "relative", zIndex: 1 }}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

