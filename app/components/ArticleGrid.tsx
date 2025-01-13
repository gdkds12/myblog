// app/components/ArticleGrid.tsx
"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/ghost';
import Link from 'next/link';
import Image from 'next/image';
import { PostOrPage } from '@tryghost/content-api';

interface ArticleGridProps {
    theme: string;
}

const ArticleGrid: React.FC<ArticleGridProps> = ({ theme }) => {
    const [posts, setPosts] = useState<PostOrPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const fetchedPosts = await api.posts.browse({
                    limit: 8,
                    include: ['tags', 'authors'],
                    order: 'published_at DESC'
                });
                setPosts(fetchedPosts);
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
                        href={`/${post.slug}`}
                        className="group relative flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        {/* 썸네일 이미지 컨테이너 */}
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
                        {/* 텍스트 내용 */}
                        <div className="p-4">
                            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                                {post.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                {post.excerpt}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default ArticleGrid;