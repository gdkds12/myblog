// app/components/Header.tsx
"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > 400) {
          setIsAtTop(false);
          setIsVisible(window.scrollY < lastScrollY);
        } else {
          setIsAtTop(true);
          setIsVisible(true);
        }
        lastScrollY = window.scrollY;
      }
    };

    let lastScrollY = 0;
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);

      // cleanup function
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 transition-all duration-300 z-50 ${isAtTop ? '' : (isVisible ? 'translate-y-0' : '-translate-y-full')}`}>
      <div className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md px-8 py-3 text-black dark:text-white border border-gray-300 dark:border-gray-700">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center">
                  <img src="/logo.png" alt="Logo" className="h-6 w-6" />
                </Link>
                <Link href="/blog" className="text-sm font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">블로그</Link>
                <Link href="/articles" className="text-sm font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">아티클</Link>
                <Link href="/docs" className="text-sm font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">문서</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
