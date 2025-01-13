// app/articles/page.tsx
"use client";

import Header from '../components/Header';
import Footer from '../components/Footer';
import DarkModeToggle from "../components/DarkModeToggle";
import { useTheme } from "next-themes";
import ArticleHero from '../components/ArticleHero';
import ArticleGrid from '../components/ArticleGrid';

export default function ArticlePage() {
    const { theme } = useTheme();
    const currentTheme = theme || 'light';


  return (
    <div className={`min-h-screen bg-white dark:bg-[#121212] flex flex-col`}>
        <Header />
        {/* DarkModeToggle를 헤더 바깥으로 이동 */}
        <div className="container mx-auto px-4 flex justify-end mt-6" style={{position:'relative', zIndex: 10}}>
             <DarkModeToggle  />
        </div>

      {/* Hero Section */}
      <main className="flex-grow py-1">
          <section className="container mx-auto px-4 pt-4 pb-8 md:max-w-full lg:max-w-[1200px]">
            <div className="hidden md:block">
                <ArticleHero theme={currentTheme} />
            </div>
          </section>

        {/* Article Grid */}
        <section className="container mx-auto px-4 pt-2 pb-8 md:max-w-[900px] lg:max-w-[1200px]"> {/* 상단 패딩 줄임 */}
            <ArticleGrid theme={currentTheme} />
          </section>
      </main>
      <Footer />
    </div>
  )
}