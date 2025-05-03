// app/components/FeaturedPosts.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import api from '@/lib/ghost';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostOrPage, Tag } from "@tryghost/content-api";

interface TagWithSlug extends Tag {
    slug: string;
}

interface PostWithTags extends PostOrPage {
    tags?: TagWithSlug[];
}

interface FeaturedPostsProps {
  featuredPosts: PostWithTags[];
}

export default function FeaturedPosts({ featuredPosts }: FeaturedPostsProps) {
  if (!featuredPosts || featuredPosts.length === 0) {
      return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {featuredPosts.map((post, index) => (
        <Card 
          key={post.id} 
          className={`
            ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''} 
            aspect-[8/5] relative overflow-hidden group
          `}
        >
          <Link href={`/post/${post.slug}`} className="block h-full">
            {post.feature_image && (
              <div className="absolute inset-0">
                <Image
                  src={post.feature_image}
                  alt={post.title || ''}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                   unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-50" />
              </div>
            )}
            <CardContent className={`absolute bottom-0 left-0 right-0 ${index === 0 ? 'p-6' : 'px-6 py-3'} text-white h-[30%]`}>
              <div className="h-full flex flex-col justify-end">
                <h3 className={`${index === 0 ? 'text-2xl mb-2' : 'text-lg'} font-semibold`}>
                  {post.title}
                </h3>
                {index === 0 && post.excerpt && (
                  <p className="text-sm text-gray-200 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}