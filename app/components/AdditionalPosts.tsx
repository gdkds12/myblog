"use client";

import api from '@/lib/ghost';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostOrPage } from "@tryghost/content-api";

export default function AdditionalPosts() {
  const [posts, setPosts] = useState<PostOrPage[]>([]);

  useEffect(() => {
    api.posts
      .browse({limit: 4, include: ['tags', 'authors']})
      .then((fetchedPosts) => {
        setPosts(fetchedPosts);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <>
      <h2 className="text-2xl font-bold mt-12 mb-6">최신 글</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <div key={post.id} className="group overflow-hidden">
            <Link href={`/${post.slug}`} className="flex flex-col h-full">
              <div className="relative w-full pb-[64%] rounded-lg overflow-hidden">
                {post.feature_image && (
                  <Image
                    src={post.feature_image}
                    alt={post.title || ''}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
