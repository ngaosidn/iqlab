import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'I-Qlab (Interactive Quran Lab)',
  description: 'Interactive Quran Lab untuk mempelajari dan memahami kitab suci dengan lebih mudah.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'I-Qlab',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'I-Qlab',
    title: 'I-Qlab (Interactive Quran Lab)',
    description: 'Interactive Quran Lab untuk mempelajari dan memahami kitab suci dengan lebih mudah.',
  },
  twitter: {
    card: 'summary',
    title: 'I-Qlab (Interactive Quran Lab)',
    description: 'Interactive Quran Lab untuk mempelajari dan memahami kitab suci dengan lebih mudah.',
  },
}; 