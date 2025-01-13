// app/components/Header.tsx
"use client";
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function Header() {
    const [isVisible, setIsVisible] = useState(true);
    const [isAtTop, setIsAtTop] = useState(true);
    const pathname = usePathname();
    const { theme } = useTheme();
    const lastScrollY = useRef(0);


    const logoStyle = {
        filter: theme === 'light' ? 'invert(1)' : 'none',
        transition: 'filter 0.3s ease',
    };
    
     const controlNavbar = useCallback(() => {
        if (typeof window !== 'undefined') {
          const currentScrollY = window.scrollY;

          if (currentScrollY > 400) {
            setIsAtTop(false);
            setIsVisible(currentScrollY < lastScrollY.current);
           } else {
            setIsAtTop(true);
            setIsVisible(true);
        }
          lastScrollY.current = currentScrollY;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [controlNavbar]);


    return (
        <header
            className={`fixed top-0 left-0 right-0 transition-all duration-300 z-50 ${
                isAtTop
                    ? ""
                    : isVisible
                    ? "translate-y-0"
                    : "-translate-y-full"
            }`}
        >
            <div className="py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md px-8 py-3 text-black dark:text-white border border-gray-300 dark:border-gray-700">
                            <div className="flex items-center space-x-8">
                                <Link href="/" className="flex items-center">
                                    <Image
                                        src="/logo.png"
                                        alt="Logo"
                                        width={24}
                                        height={24}
                                        style={logoStyle}
                                        unoptimized
                                    />
                                </Link>
                                <Link
                                    href="/"
                                    className={`text-sm font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 ${
                                        pathname === "/"
                                            ? "relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-black dark:after:bg-white"
                                            : ""
                                    }`}
                                >
                                    블로그
                                </Link>
                                <Link
                                    href="/articles"
                                    className={`text-sm font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 ${
                                        pathname === "/articles"
                                            ? "relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-black dark:after:bg-white"
                                            : ""
                                    }`}
                                >
                                    아티클
                                </Link>
                                 <Link
                                    href="/docs"
                                    className={`text-sm font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 ${
                                        pathname === "/docs"
                                            ? "relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-black dark:after:bg-white"
                                            : ""
                                    }`}
                                >
                                    문서
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}