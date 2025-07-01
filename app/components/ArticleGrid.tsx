// app/components/ArticleGrid.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostOrPage, Tag } from '@/lib/types';

interface ArticleGridProps {
    theme: string;
}

interface TagWithSlug extends Tag {
    slug: string;
}

interface PostWithTags extends PostOrPage {
    tags?: TagWithSlug[];
}

const ArticleGrid: React.FC<ArticleGridProps> = ({ theme }) => {
    const [posts, setPosts] = useState<PostWithTags[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/posts/browse?limit=8&include=tags,authors&order=published_at%20DESC');
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const fetchedPosts = await response.json();

                const postsWithTags = fetchedPosts.map((post: PostOrPage) => ({
                    ...post,
                    tags: post.tags?.map((tag: Tag) => ({
                        ...tag,
                         slug: tag.slug
                    }))
                }));
                setPosts(postsWithTags.filter((post: PostWithTags) => post.tags?.some((tag: Tag) => tag.slug === 'article')));
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error fetching posts:', error);
                setError("Failed to load articles.");
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (isLoading) {
        return <div className="text-lg">Loading articles...</div>;
    }

    if (error) {
        return <div className="text-lg text-red-500">{error}</div>;
    }

    if (!posts || posts.length === 0) {
        return <div className="text-lg">No articles found.</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
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
                        href={`/article/${post.slug}`}
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
                         <div className="flex flex-col flex-1 py-4"> {/* 상하 패딩 추가 */}
                            <div className="flex flex-col flex-1">
                                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                                    {post.title}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-auto">{formattedDate}</span> {/* mt-auto 추가하여 날짜를 아래로 */} 
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default ArticleGrid;