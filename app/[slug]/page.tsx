"use client"; // 클라이언트 측 렌더링을 위해 추가

import { useState, useEffect } from 'react';
import api from '@/lib/ghost';
import { useParams } from 'next/navigation';
import { PostOrPage } from "@tryghost/content-api";
import DarkModeToggle from '../components/DarkModeToggle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent } from "@/components/ui/card";
import ScrollProgressBar from '../components/ScrollProgressBar';
import CodeBlock from '../components/CodeBlock';
import PostHeader from '../components/PostHeader';
import TableOfContents from '../components/TableOfContents';
import parse from 'html-react-parser';
import Notice from '../components/Notice';

export default function Post() {
    const [post, setPost] = useState<PostOrPage | null>(null);
    const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
    const params = useParams();
    const slug = params.slug as string;

    useEffect(() => {
        async function fetchPost() {
            try {
                const fetchedPost = await api.posts.read({ slug }, { include: ['tags', 'authors'] });
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
                    return <Notice type={domNode.attribs.type}>{domNode.children[0].data}</Notice>;
                }
                if (domNode.type === 'tag' && domNode.name === 'pre' && domNode.children[0]?.name === 'code') {
                    const className = domNode.children[0].attribs.class;
                    const match = /language-(\w+)/.exec(className || '');
                    if (match) {
                        return (
                            <CodeBlock
                                language={match[1]}
                                code={domNode.children[0].children[0].data}
                            />
                        );
                    }
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
    const postFeatureImage = post?.feature_image || '';

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-[#E4E4E7]">
            <ScrollProgressBar />
            <Header />
            <div className="fixed top-4 right-4 z-50">
                <DarkModeToggle />
            </div>
            <main className="flex-grow mx-auto py-0 sm:px-6 lg:px-8 xl:px-16 max-w-full lg:max-w-[95%] flex">
                {!post ? (
                    <div>Loading...</div>
                ) : (
                    <div className="flex flex-col lg:flex-row lg:gap-8 w-full">
                        <Card className="w-full lg:w-[75%] bg-transparent border-none shadow-none p-0 lg:ml-16">
                            <PostHeader title={postTitle} tags={postTags} featureImage={postFeatureImage} />
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none">
                                    {renderContent(post.html || '')}
                                </div>
                            </CardContent>
                        </Card>
                        <TableOfContents toc={toc} />
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
