// app/components/ArticleHero.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PostOrPage } from "@tryghost/content-api";

interface ArticleHeroProps {
  theme: string;
}

const ArticleHero = ({ theme }: ArticleHeroProps) => {
    const [featuredPosts, setFeaturedPosts] = useState<PostOrPage[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            setError(null); // 에러 상태 초기화
            try {
                // API Route 호출로 변경
                const response = await fetch('/api/posts/browse?limit=5&include=tags,authors&order=published_at%20DESC&filter=tags:[atikeul]');
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const posts = await response.json();

                 posts.forEach((post: PostOrPage) => {
                    console.log(`Post title: ${post.title}`);
                    if (post.tags && post.tags.length > 0) {
                        console.log(`  Tags:`, post.tags);
                        post.tags.forEach(tag => {
                            console.log(`   - Tag Name: ${tag.name}, Slug: ${tag.slug}`);
                        })
                    } else {
                      console.log(`  No tags found for this post.`);
                    }
                  });
                setFeaturedPosts(posts);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error fetching posts:', error);
                setError("Failed to load featured posts.");
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

     const handlePrevSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === 0 ? featuredPosts.length - 1 : prevSlide - 1));
    };
    
    const handleNextSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === featuredPosts.length - 1 ? 0 : prevSlide + 1));
    };
    
    if (isLoading) {
      return <div className="text-lg">Loading featured posts...</div>;
    }

    if (error) {
      return <div className="text-lg text-red-500">{error}</div>;
    }

    if (!featuredPosts || featuredPosts.length === 0) {
      return <div className="text-lg">No featured posts found.</div>
    }

    const currentPost = featuredPosts[currentSlide];
    const formattedDate = currentPost.published_at
    ? new Date(currentPost.published_at).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\//g, '-')
    : '날짜 정보 없음';

  return (
    <div className="relative">
        {/* 21:9 비율 컨테이너 및 배경 추가 */}
        <div className="aspect-[21/9] overflow-hidden rounded-lg flex bg-gray-100 dark:bg-[#1b1b1b] p-10">
            {/* 카드 컨테이너 */}
             <div className="flex items-center justify-center relative h-full -mr-2" style={{ width: '420px' }}>
                 <Link href={`/article/${currentPost.slug}`} className="block group relative"> {/* 변경된 부분 */}
                    <div className={`bg-blue-500 dark:bg-blue-700 text-white dark:text-gray-100 h-[420px] w-[420px] rounded-xl overflow-hidden`}>
                        <div className="relative w-full h-full">
                           {currentPost.feature_image && (
                                <Image
                                    src={currentPost.feature_image}
                                    alt={currentPost.title || ''}
                                    width={420}
                                    height={420}
                                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                                    unoptimized
                                />
                            )}
                            <div className="absolute inset-0 bg-black/20" /> {/* 오버레이 불투명도 조정 */}
                        </div>
                    </div>
                </Link>
            </div>
            {/* 내용과 슬라이드 컨트롤 컨테이너 */}
            <div className="w-1/2 flex flex-col justify-between relative">
                
                <div className="pl-8 mt-4">
                  {/* 슬라이드 컨트롤 */}
                  <div className="flex items-center justify-between w-full mb-8"> {/* 슬라이드 컨트롤 간격 조정 */}
                      <div className="flex items-center space-x-2 mr-4">
                          {[...Array(featuredPosts.length)].map((_, index) => (
                              <button
                                  key={index}
                                  className={`w-2 h-2 rounded-full ${
                                  index === currentSlide ? 'bg-gray-500' : 'bg-gray-500/50 dark:bg-gray-500 dark:bg-opacity-50'
                                  }`}
                                  aria-label={`Go to slide ${index + 1}`}
                                  onClick={(e) => {
                                      e.stopPropagation(); // 이벤트 전파 방지
                                  }}
                              />
                          ))}
                      </div>
                      <div className="flex items-center space-x-4">
                          <button aria-label="Previous slide" onClick={handlePrevSlide}>
                              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button aria-label="Next slide" onClick={handleNextSlide}>
                              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </button>
                      </div>
                  </div>
                  <div className="group">
                      <Link href={`/article/${currentPost.slug}`} className="block">
                       <div className="flex flex-col items-start transition-colors duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400" style={{ lineHeight: '1.7' }}>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mb-5">Article</span>
                                <h2 className="text-4xl font-semibold mb-7">
                                    {currentPost.title}
                                </h2>
                           <p className="text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {currentPost.excerpt}
                            </p>
                           <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                         </div>
                      </Link>
                 </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ArticleHero;