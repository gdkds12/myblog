// app/layout.tsx
import './globals.css';
import { ThemeProvider } from 'next-themes';
import PageTransition from './components/PageTransition';
import Header from './components/Header';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <title>Your Blog Title</title>
      </head>
      <body className="bg-white dark:bg-darkBg text-gray-900 dark:text-darkText min-h-full font-pretendard">
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