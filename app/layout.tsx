import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Newsreader } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CommandPalette } from '@/components/CommandPalette';
import { THEME_SCRIPT } from './theme-script';
import './globals.css';

/** Headlines only. Optical sizing keeps large type tight and small type readable. */
const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-newsreader',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'SCOPE — News Intelligence',
    template: '%s · SCOPE',
  },
  description:
    'German and global news from reliable sources, grouped by the event itself so you can see how different outlets frame the same story.',
  applicationName: 'SCOPE',
  openGraph: {
    title: 'SCOPE — News Intelligence',
    description:
      'German and global news, grouped by the event itself so you can see how different outlets frame the same story.',
    type: 'website',
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
