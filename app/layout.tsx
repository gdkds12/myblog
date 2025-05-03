// app/layout.tsx
import './globals.css';
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Your Blog Title</title>
      </head>
      <body className="bg-white dark:bg-darkBg text-gray-900 dark:text-darkText min-h-full font-pretendard">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="w-full px-0 sm:px-6 lg:px-8 pt-[80px]">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}