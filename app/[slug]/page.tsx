"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/ghost';
import { useParams, useRouter } from 'next/navigation';
import { PostOrPage } from "@tryghost/content-api";
import DarkModeToggle from '../components/DarkModeToggle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock } from 'lucide-react';
import readingTime from 'reading-time';
import parse from 'html-react-parser';
import Notice from '../components/Notice';
import ScrollProgressBar from '../components/ScrollProgressBar';
import CodeBlock from '../components/CodeBlock'; // CodeBlock 컴포넌트 임포트

export default function Post() {
    const [post, setPost] = useState<PostOrPage | null>(null);
    const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    useEffect(() => {
        async function fetchPost() {
            try {
                const fetchedPost = await api.posts.read({ slug }, { include: ['tags', 'authors'] });
                setPost(fetchedPost);
                document.title = fetchedPost.title || 'Blog Post';
                
                // Generate Table of Contents
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
                                code={domNode.children[0].children[0].data} // code 속성 사용
                            />
                        );
                    }
                }
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-[#E4E4E7]">
            <ScrollProgressBar />
            <Header />
            <div className="fixed top-4 right-4 z-50">
                <DarkModeToggle />
            </div>
            <main className="flex-grow mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 max-w-full lg:max-w-[1300px] xl:max-w-[1600px]">
                {!post ? (
                    <div>Loading...</div>
                ) : (
                    <div className="flex flex-col lg:flex-row lg:gap-8">
                        <Card className="w-full lg:w-[70%] bg-transparent border-none shadow-none">
                            <CardHeader>
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex items-center text-sm mb-4 hover:underline"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    블로그로 돌아가기
                                </button>
                                <CardTitle className="text-3xl md:text-4xl font-bold mb-4">{post.title}</CardTitle>
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {readingTime(post.html || '').text}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post?.tags &&
                                        post.tags.map((tag) => (
                                            <span key={tag.id} className="px-3 py-1 text-sm border rounded-full">
                                                {tag.name || ''}
                                            </span>
                                        ))}
                                </div>
                                {post.feature_image && (
                                    <img
                                        src={post.feature_image}
                                        alt={post.title}
                                        className="w-full h-auto object-cover rounded-lg mt-4"
                                    />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none">
                                    {renderContent(post.html || '')}
                                </div>
                            </CardContent>
                        </Card>
                        <aside className="w-full lg:w-[24%] mt-8 lg:mt-0 lg:sticky lg:top-20">
                            <div>
                                <h3 className="text-xl font-bold mb-4">목차</h3>
                                <ul>
                                    {toc.map((item: { id: string; text: string }) => (
                                        <li key={item.id} className="mb-2">
                                            <a href={`#${item.id}`} className="hover:underline">
                                                {item.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

