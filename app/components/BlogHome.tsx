"use client";
import { useState, useMemo, useEffect } from "react";
import Categories from "./Categories";
import FeaturedPosts from "./FeaturedPosts";
import AdditionalPosts from "./AdditionalPosts";
import DarkModeToggle from "./DarkModeToggle";
import type { Post, Tag } from "@/lib/types";

interface Props {
  posts: Post[];
  tags: Tag[];
}

export default function BlogHome({ posts, tags }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const [isAppearing, setIsAppearing] = useState(true);

  // 태그별 분류
  const getSlugs = (p: Post) => {
    const tagSlugs = (p.tags ?? []).map((t) => (t.slug ?? '').toLowerCase());
    // category가 tag로 변환되어 있을 수도 있음 (toGhostLikePost에서 처리)
    return tagSlugs;
  };

  // Posts explicitly tagged with 'blog'. If none exist, fall back to all posts
  const blogPosts = useMemo(() => {
    const filtered = posts.filter((p) => p.slug && getSlugs(p).includes('blog'));
    return filtered.length > 0 ? filtered : posts;
  }, [posts]);
  // Posts for the hero section – tagged with 'main'. If none exist, reuse the latest blogPosts
  const mainPosts = useMemo(() => {
    const filtered = posts.filter((p) => p.slug && getSlugs(p).includes('main'));
    return filtered.length > 0 ? filtered : blogPosts.slice(0, 3);
  }, [posts, blogPosts]);

  const additionalPosts = useMemo(() => {
    const base = blogPosts; // already ensured to be non-empty
    if (selectedSlug) {
      return base.filter((p) => p.tags?.some((t) => t.slug === selectedSlug));
    }
    return base;
  }, [blogPosts, selectedSlug]);

  // 새 필터 결과가 마운트될 때만 페이드-인
  useEffect(() => {
    setIsAppearing(true);
    const id = setTimeout(() => setIsAppearing(false), 10); // next paint
    return () => clearTimeout(id);
  }, [selectedSlug]);

  console.log('Debug slugs', posts.map(p=>({slug:p.slug, slugs:getSlugs(p)})));
  console.log('Debug blogPosts', blogPosts.length, blogPosts.map(p=>p.slug));
  console.log('Debug mainPosts', mainPosts.length, mainPosts.map(p=>p.slug));
  const featuredPosts = mainPosts; // fallback logic already applied above

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Categories
          tags={tags}
          selectedSlug={selectedSlug}
          onSelect={(slug) => setSelectedSlug(slug)}
        />
        <DarkModeToggle />
      </div>
      <div className={`transition-opacity duration-300 ${isAppearing ? 'opacity-0' : 'opacity-100'}`}>
        <FeaturedPosts featuredPosts={featuredPosts as any} />
        <AdditionalPosts posts={additionalPosts as any} />
      </div>
    </>
  );
}
