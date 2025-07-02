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

  const filteredPosts = useMemo(() => {
    if (!selectedSlug) return posts;
    return posts.filter((p) => p.tags?.some((t) => t.slug === selectedSlug));
  }, [posts, selectedSlug]);

  // 새 필터 결과가 마운트될 때만 페이드-인
  useEffect(() => {
    setIsAppearing(true);
    const id = setTimeout(() => setIsAppearing(false), 10); // next paint
    return () => clearTimeout(id);
  }, [selectedSlug]);

  const featuredPosts = filteredPosts.slice(0, 3);
  const additionalPosts = filteredPosts.slice(3, 9);

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
