// /app/components/DarkModeToggle.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const DarkModeToggle = () => {
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
            className="relative flex items-center justify-between rounded-full w-14 h-7 p-1 border border-gray-300 dark:border-gray-600 transition-colors duration-300 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none"
        >
            <div
                className={`absolute top-1 left-1 bottom-1 my-auto bg-white/50 dark:bg-gray-600/50 rounded-full w-[20px] h-[20px] transition-transform duration-300 ${
                    theme === 'dark' ? 'transform translate-x-[28px]' : ''
                }`}
            />
            <SunIcon className={`h-4 w-4 stroke-2 transition-colors ${theme === 'light' ? 'text-yellow-500' : 'text-gray-500'}`} />
            <MoonIcon className={`h-4 w-4 stroke-2 transition-colors ${theme === 'dark' ? 'text-blue-400' : 'text-gray-500'}`} />
        </button>
    );
};

export default DarkModeToggle;