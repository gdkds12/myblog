// app/layout.tsx
import './globals.css';
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import PageTransition from './components/PageTransition';
import Header from './components/Header';
import GoogleAnalytics from './components/GoogleAnalytics';
import GoogleTagManager from './components/GoogleTagManager';
import type { Metadata } from 'next';

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400','700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Greedient - 기술 트렌드와 인사이트',
    template: '%s | Greedient'
  },
  description: '최신 기술 트렌드, AI, 개발, 비즈니스 인사이트를 제공하는 블로그입니다.',
  keywords: ['기술', 'AI', '개발', '블로그', '트렌드', '인사이트', 'tech', 'technology'],
  authors: [{ name: '관리자' }],
  creator: 'Greedient',
  publisher: 'Greedient',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://greedient.kr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Greedient - 기술 트렌드와 인사이트',
    description: '최신 기술 트렌드, AI, 개발, 비즈니스 인사이트를 제공하는 블로그입니다.',
    url: 'https://greedient.kr',
    siteName: 'Greedient',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'Greedient 블로그',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Greedient - 기술 트렌드와 인사이트',
    description: '최신 기술 트렌드, AI, 개발, 비즈니스 인사이트를 제공하는 블로그입니다.',
    images: ['/logo.webp'],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSans.className} suppressHydrationWarning>
      <head>
        {/* Preconnect & DNS Prefetch for remote media domain to improve LCP */}
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.greedient.kr" />
        <link rel="preconnect" href="https://img.greedient.kr" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="Greedient RSS Feed" href="/feed.xml" />
        
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: 'Greedient',
              description: '최신 기술 트렌드, AI, 개발, 비즈니스 인사이트를 제공하는 블로그',
              url: 'https://greedient.kr',
              author: {
                '@type': 'Person',
                name: '관리자'
              },
              publisher: {
                '@type': 'Organization',
                name: 'Greedient',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://greedient.kr/logo.webp'
                }
              }
            })
          }}
        />
      </head>
      <body className="bg-white dark:bg-darkBg text-gray-900 dark:text-darkText min-h-full">
        <GoogleTagManager />
        <GoogleAnalytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <div className="w-full px-0 sm:px-6 lg:px-8 pt-[80px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}