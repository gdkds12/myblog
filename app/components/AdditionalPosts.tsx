// app/components/AdditionalPosts.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostOrPage, Tag } from "@/lib/types";

interface TagWithSlug extends Tag {
    slug: string;
}

interface PostWithTags extends PostOrPage {
    tags?: TagWithSlug[];
}

interface AdditionalPostsProps {
  posts: PostWithTags[];
}

export default function AdditionalPosts({ posts }: AdditionalPostsProps) {
  if (!posts || posts.length === 0) {
      return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold mt-12 mb-6">최신 글</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <div key={post.id} className="group overflow-hidden">
            <Link href={`/post/${post.slug}`} className="flex flex-col h-full">
              <div className="relative w-full pb-[64%] rounded-lg overflow-hidden">
                {post.feature_image && (
                  <Image
                    src={post.feature_image}
                    alt={post.title || ''}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                     
                  />
                )}
              </div>
              <div className="mt-4 flex-grow bg-transparent">
                <h3 className="text-xl font-semibold text-left">{post.title}</h3>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}