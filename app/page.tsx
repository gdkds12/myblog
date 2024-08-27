"use client";
import Header from './components/Header';
import Categories from './components/Categories';
import DarkModeToggle from './components/DarkModeToggle';
import FeaturedPosts from './components/FeaturedPosts';
import AdditionalPosts from './components/AdditionalPosts';
import Footer from './components/Footer';

export default function Home() {
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
        </div>
      </main>
      <Footer />
    </div>
  );
}