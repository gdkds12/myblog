import './globals.css';
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-darkBg text-gray-900 dark:text-darkText min-h-full font-pretendard">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[80px]">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
