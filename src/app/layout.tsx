import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GradeScope',
  description: 'AI-powered assignment marking and student tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="md:ml-56 min-h-screen p-4 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
