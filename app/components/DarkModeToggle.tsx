"use client";
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="relative rounded-full w-14 h-7 focus:outline-none border border-gray-300 dark:border-gray-600 transition-colors duration-300"
    >
      <div
        className={`absolute top-[2px] left-[2px] bg-white dark:bg-gray-800 opacity-70 rounded-full w-[24px] h-[24px] transition-transform duration-300 ${
          theme === 'dark' ? 'transform translate-x-7' : ''
        }`}
      />
      <SunIcon className="absolute left-1.5 top-1.5 h-4 w-4 text-gray-800 dark:text-gray-200 stroke-2" />
      <MoonIcon className="absolute right-1.5 top-1.5 h-4 w-4 text-gray-800 dark:text-gray-200 stroke-2" />
    </button>
  );
}
