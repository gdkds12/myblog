"use client";
import Header from './components/Header';
import Categories from './components/Categories';
import DarkModeToggle from './components/DarkModeToggle';
import FeaturedPosts from './components/FeaturedPosts';
import AdditionalPosts from './components/AdditionalPosts';
import Footer from './components/Footer';
import api from '@/lib/ghost';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PostOrPage } from "@tryghost/content-api";

export default function Home() {
  const [pages, setPages] = useState<PostOrPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.pages
      .browse({limit: 'all'})
      .then((fetchedPages) => {
        setPages(fetchedPages);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-full md:max-w-[80%] mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <Categories />
            <DarkModeToggle />
          </div>
          <FeaturedPosts />
          <AdditionalPosts />
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">페이지</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <ul>
                {pages.map((page) => (
                  <li key={page.id}>
                    <Link href={`/page/${page.slug}`}>{page.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
