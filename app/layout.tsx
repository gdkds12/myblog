// app/layout.tsx
import './globals.css';
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import PageTransition from './components/PageTransition';
import Header from './components/Header';


const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400','700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSans.className} suppressHydrationWarning>
      <head>
        {/* Preconnect & DNS Prefetch for remote media domain to improve LCP */}
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <title>greedient 블로그</title>
      </head>
      <body className="bg-white dark:bg-darkBg text-gray-900 dark:text-darkText min-h-full">
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