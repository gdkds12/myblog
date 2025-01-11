// /app/article/page.tsx

"use client";

import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DarkModeToggle from "../components/DarkModeToggle";
import { useEffect, useState } from "react";
import ArticleHero from '../components/ArticleHero';
import ArticleGrid from '../components/ArticleGrid';

const getInitialTheme = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    const storedPrefs = window.localStorage.getItem("color-theme");
    if (typeof storedPrefs === "string") {
      return storedPrefs;
    }
    const userMedia = window.matchMedia("(prefers-color-scheme: dark)");
    if (userMedia.matches) {
      return "dark";
    }
  }
  return "light";
};

export default function ArticlePage() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("color-theme", theme);
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      }, [theme]);


  return (
    <div className={`min-h-screen bg-white dark:bg-[#121212] flex flex-col`}>
        <Header />
        <div className="container mx-auto px-4 flex justify-end">
             <DarkModeToggle  />
        </div>

      {/* Hero Section */}
      <main className="flex-grow py-6">
        <section className="container mx-auto px-4 py-8">
          <ArticleHero theme={theme} />
           <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center dark:bg-gray-800 dark:text-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center dark:bg-gray-800 dark:text-gray-100">
            <ChevronRight className="w-6 h-6" />
          </button>
        </section>

      {/* Article Grid */}
      <section className="container mx-auto px-4 py-8">
         <ArticleGrid theme={theme} />
      </section>
      </main>
      <Footer />
    </div>
  )
}