// app/article/[slug]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/ghost';
import { useParams } from 'next/navigation';
import { PostOrPage } from "@tryghost/content-api";
import DarkModeToggle from '../../components/DarkModeToggle';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Card, CardContent } from "@/components/ui/card";
import ScrollProgressBar from '../../components/ScrollProgressBar';
import CodeBlock from '../../components/CodeBlock';
import PostHeader from '../../components/PostHeader';
import ArticlePostHeader from '../../components/ArticlePostHeader';
import parse from 'html-react-parser';
import Notice from '../../components/Notice';
import CommentSection from '../../components/CommentSection';
import { useTheme } from 'next-themes';

export default function Article() {
    const [post, setPost] = useState<PostOrPage | null>(null);
    const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
    const params = useParams();
    const slug = params.slug as string;
    const { theme } = useTheme();

    useEffect(() => {
        async function fetchPost() {
            try {
                const fetchedPost = await api.posts.read(
                    { slug },
                    { include: ['tags', 'authors'], filter: 'tag:article' }
                );
                setPost(fetchedPost);
                document.title = fetchedPost.title || 'Blog Post';

                const headings = fetchedPost.html?.match(/<h2.*?>(.*?)<\/h2>/g) || [];
                const tocItems = headings.map((heading) => {
                    const text = heading.replace(/<[^>]+>/g, '');
                    const id = text.toLowerCase().replace(/\s+/g, '-');
                    return { id, text };
                });
                setToc(tocItems);
            } catch (error) {
                console.error('Error fetching post:', error);
            }
        }

        fetchPost();
    }, [slug]);

  const renderContent = (content: string) => {
        const processNotices = (htmlString: string) => {
            const noticeRegex = /\[(notice|info|warning|success|error)\]([\s\S]*?)\[\/\1\]/g;
            return htmlString.replace(noticeRegex, (match, type, content) => {
                return `<Notice type="${type}">${content}</Notice>`;
            });
        };

        const processedContent = processNotices(content);

         return parse(processedContent, {
            replace: (domNode: any) => {
              if (domNode.type === 'tag' && domNode.name === 'notice') {
                    return <Notice type={domNode.attribs.type}>{domNode.children[0]?.data}</Notice>;
                }
                if (domNode.type === 'tag' && domNode.name === 'pre' && domNode.children[0]?.name === 'code') {
                    const className = domNode.children[0].attribs.class;
                    const match = /language-(\w+)/.exec(className || '');
                    if (match) {
                        return (
                            <CodeBlock
                                language={match[1]}
                                code={domNode.children[0].children[0]?.data}
                            />
                        );
                    }
                }

                 if (domNode.type === 'tag' && domNode.name === 'h2') {
                     // ID를 추가하여 목차와 연결
                    if(domNode.children && domNode.children[0] && domNode.children[0].data){
                        const text = domNode.children[0].data;
                        const id = text.toLowerCase().replace(/\s+/g, '-');
                        return <h2 id={id}>{text}</h2>;
                    }
                    return <h2/>; // text가 없는 경우 비어있는 h2태그 반환
                 }
            }
        });
    };
    // 포스트가 없는 경우 기본값 설정
    const postTitle = post?.title || '제목 없음';
    const postTags = post?.tags?.map(tag => ({
        id: tag.id,
        name: tag.name || '' // name이 undefined일 경우 빈 문자열로 대체
    })) || [];
     // 날짜 형식
     const postDate = post?.published_at ? new Date(post.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) : '';
      const readingTime = post?.reading_time ? String(post.reading_time) + ' min read' : '1 min read'; // 읽는 시간

    return (
        <div className={`min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-[#E4E4E7] ${theme === 'dark' ? 'dark' : ''}`}>
            <ScrollProgressBar />
            <Header />
            <div className="fixed top-4 right-4 z-50">
                <DarkModeToggle />
            </div>
             <main className="flex-grow mx-auto py-0 w-full flex justify-center">
                {!post ? (
                    <div>Loading...</div>
                ) : (
                   <div className="w-full px-4 sm:px-0 lg:px-8 mx-auto max-w-[800px]">
                         <div className="pt-24"> {/* pt-8을 pt-24로 변경 */}
                            <ArticlePostHeader
                                title={postTitle}
                                tags={postTags}
                                date={postDate}
                                readingTime={readingTime}
                            />
                          </div>
                        <Card className="w-full bg-transparent border-none shadow-none p-0 ">
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none">
                                     {renderContent(post.html || '')}
                                </div>
                                <CommentSection slug={slug} />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}