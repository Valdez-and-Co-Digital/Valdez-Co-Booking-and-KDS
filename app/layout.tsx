import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ImpersonationProvider } from '@/providers/ImpersonationProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: {
    default: 'SwiftKDS — Smart Booking & Kitchen Display',
    template: '%s | SwiftKDS',
  },
  description:
    'SwiftKDS by Valdez & Co. — The smart booking and kitchen display system for salons and food trucks.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://swiftkds.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SwiftKDS',
    title: 'SwiftKDS — Smart Booking & KDS',
    description: 'Powered by SwiftKDS, a Valdez & Co. product.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents zoom on mobile input focus
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SwiftKDS" />
      </head>
      <body className="bg-mesh antialiased" suppressHydrationWarning>
        <ImpersonationProvider>
          {children}
        </ImpersonationProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
