// app/components/ArticleHero.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PostOrPage } from "@/lib/types";

interface ArticleHeroProps {
  theme?: string;
  initialPosts?: PostOrPage[];
}

export default function ArticleHero({ theme, initialPosts }: ArticleHeroProps) {
  const [posts, setPosts] = useState<PostOrPage[]>(initialPosts ?? []);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          "/api/posts/browse?limit=5&include=tags,authors&order=published_at%20DESC"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const filteredPosts = (data as PostOrPage[]).filter((post: PostOrPage) =>
          (post.tags ?? []).some((t) => t.slug === "article")
        );
        setPosts(filteredPosts);
      } catch (e: any) {
        setError(e.message ?? "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [initialPosts]);

  if (loading) return <div className="h-24" />;
  if (error) return <div className="text-lg text-red-500">{error}</div>;
  if (posts.length === 0) return <div className="text-lg">No featured posts found.</div>;

  const post = posts[index];
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).replace(/\//g, "-")
    : "";

  const prev = () => setIndex((i) => (i === 0 ? posts.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === posts.length - 1 ? 0 : i + 1));

  return (
    <div className="relative">
      <div className="aspect-[21/9] overflow-hidden rounded-lg flex bg-gray-100 dark:bg-[#1b1b1b] p-10">
        {/* left image card */}
        <Link
          href={`/article/${post.slug}`}
          className="relative group aspect-square w-[420px] flex-shrink-0 rounded-xl overflow-hidden"
        >
          {post.feature_image && (
            <>
              <Image
                src={post.feature_image}
                alt={post.title || ""}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                unoptimized
                priority={index === 0}
                fetchPriority={index === 0 ? 'high' : undefined}
              />
            </>
          )}
        </Link>

        {/* right content */}
        <div className="flex flex-col gap-6 ml-10 flex-1">
          {/* controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              {posts.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === index ? "bg-gray-500" : "bg-gray-400/50 dark:bg-gray-500/50"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <button aria-label="Previous slide" onClick={prev}>
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button aria-label="Next slide" onClick={next}>
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <Link href={`/article/${post.slug}`} className="group">
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-5">Article</span>
            <h2 className="text-4xl font-semibold mb-4 transition-colors duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {post.excerpt}
              </p>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}