// app/components/RelatedPosts.tsx
"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/ghost';
import Link from 'next/link';
import Image from 'next/image';
import { PostOrPage, Tag } from '@tryghost/content-api';
import { useTheme } from 'next-themes';

interface RelatedPostsProps {
  currentPostTags: Tag[];
  currentPostSlug: string;
}

interface TagWithSlug extends Tag {
  slug: string;
}

interface PostWithTags extends PostOrPage {
  tags?: TagWithSlug[];
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentPostTags, currentPostSlug }) => {
    const [relatedPosts, setRelatedPosts] = useState<PostWithTags[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const fetchRelatedPosts = async () => {
            setIsLoading(true);
            try {
                if (!currentPostTags || currentPostTags.length === 0) {
                    setRelatedPosts([]);
                    setIsLoading(false);
                    return;
                }

                const tagSlugs = currentPostTags.map(tag => tag.slug).filter(slug => slug !== undefined);

                 const fetchedPosts = await api.posts.browse({
                    limit: 6,
                    include: ['tags', 'authors'],
                    filter: `tag:[${tagSlugs.join(',')}]`,
                    order: 'published_at DESC',
                  });

                  const postsWithTags = fetchedPosts.map(post => ({
                      ...post,
                      tags: post.tags?.map(tag => ({
                        ...tag,
                        slug: tag.slug
                      }))
                    }));
                // 현재 게시물 제외
                const filteredPosts = postsWithTags.filter(post => post.slug !== currentPostSlug);
                // "blog" 태그가 있는 게시물만 포함
                 const blogPosts = filteredPosts.filter(post =>
                  post.tags?.some(tag => tag.slug === 'blog')
                );


                setRelatedPosts(blogPosts);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error fetching related posts:', error);
                setError("관련 블로그 글을 불러오는 데 실패했습니다.");
                setIsLoading(false);
            }
        };

        fetchRelatedPosts();
    }, [currentPostTags, currentPostSlug]);


    if (isLoading) {
        return <div className="text-lg">관련 블로그 글을 불러오는 중...</div>;
    }

    if (error) {
        return <div className="text-lg text-red-500">{error}</div>;
    }

    if (!relatedPosts || relatedPosts.length === 0) {
        return <div className="text-lg">관련 블로그 글이 없습니다.</div>;
    }

    return (
        <div className="mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((post) => {
                     const formattedDate = post.published_at
                     ? new Date(post.published_at).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }).replace(/\//g, '-')
                    : '날짜 정보 없음';
                  return (
                      <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="group relative flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                          <div className="relative aspect-square overflow-hidden rounded-xl">
                            {post.feature_image && (
                                <Image
                                    src={post.feature_image}
                                    alt={post.title || ""}
                                    fill
                                    className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                                    unoptimized
                                />
                            )}
                          </div>
                         <div className="flex flex-col flex-1 py-4">
                            <div className="flex flex-col flex-1">
                                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200`}>
                                    {post.title}
                                </h3>
                                <p className={`text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 flex-1`}>
                                    {post.excerpt}
                                </p>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formattedDate}</span>
                            </div>
                        </div>
                      </Link>
                  );
                })}
            </div>
        </div>
    );
};

export default RelatedPosts;