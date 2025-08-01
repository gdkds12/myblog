"use client"

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const ScrollProgressBar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // 컴포넌트가 클라이언트에 마운트되면 true (Hydration mismatch 방지)
        setMounted(true);
        const updateScrollProgress = () => {
            const scrollPx = document.documentElement.scrollTop;
            const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = `${scrollPx / winHeightPx * 100}%`;
            setScrollProgress(parseFloat(scrolled));
        };

        window.addEventListener('scroll', updateScrollProgress);

        return () => {
            window.removeEventListener('scroll', updateScrollProgress);
        };
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
            <div 
                className={`h-full transition-all duration-300 ${(!mounted || theme !== 'dark') ? 'bg-black' : 'bg-white'}`}
                style={{ width: `${scrollProgress}%` }}
            />
        </div>
    );
};

export default ScrollProgressBar;
