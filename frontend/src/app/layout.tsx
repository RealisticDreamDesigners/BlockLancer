// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import Providers from './providers';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeScript } from './theme-script';
import { JsonLd } from '@/components/seo/JsonLd';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://blocklancer.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BlockLancer - Secure Milestone Payments on Bitcoin',
    template: '%s | BlockLancer',
  },
  description:
    'BlockLancer enables trustless milestone-based payment contracts between employers and workers. Built on Stacks with Bitcoin-level security. Smart escrow, DAO governance, and dispute resolution.',
  keywords: [
    'bitcoin',
    'stacks',
    'escrow',
    'freelance',
    'payments',
    'milestone',
    'smart contracts',
    'blockchain',
    'decentralized',
    'DAO',
    'dispute resolution',
    'worker protection',
    'blocklancer',
  ],
  authors: [{ name: 'BlockLancer Team' }],
  creator: 'BlockLancer',
  publisher: 'BlockLancer',
  applicationName: 'BlockLancer',
  category: 'Finance',
  openGraph: {
    title: 'BlockLancer - Secure Milestone Payments on Bitcoin',
    description:
      'Trustless milestone-based payment contracts with Bitcoin-level security. Smart escrow, DAO governance, and dispute resolution for workers.',
    type: 'website',
    url: siteUrl,
    siteName: 'BlockLancer',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockLancer - Secure Milestone Payments on Bitcoin',
    description:
      'Trustless milestone-based payment contracts with Bitcoin-level security.',
    creator: '@blocklancer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
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
        <meta name="theme-color" content="#2563eb" />
        <ThemeScript />
        <JsonLd />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <NextTopLoader color="#2563eb" showSpinner={false} />
        <ThemeProvider>
          <Providers>
            <div id="root" className="flex flex-col min-h-screen">
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
