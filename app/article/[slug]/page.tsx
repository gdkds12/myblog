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
import { useTheme } from 'next-themes';
import RelatedArticles from '../../components/RelatedArticles';
import EditorInfo from '../../components/EditorInfo';
import Image from 'next/image'; // Import Image from next/image
import { Dialog, DialogContent, DialogOverlay } from "../../components/dialog"; // Import dialog components
import { X } from 'lucide-react'; // Import close icon

export default function Article() {
    const [post, setPost] = useState<PostOrPage | null>(null);
    const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
    const params = useParams();
    const slug = params.slug as string;
    const { theme } = useTheme();
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string | undefined } | null>(null);

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

    const handleImageClick = (src: string, alt: string | undefined) => {
        setSelectedImage({ src, alt });
        setIsImageDialogOpen(true);
    };

    const handleCloseImageDialog = () => {
        setIsImageDialogOpen(false);
        setSelectedImage(null);
    };


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
                 if (domNode.type === 'tag' && domNode.name === 'img') {
                    const src = domNode.attribs.src;
                    const alt = domNode.attribs.alt;
                    return (
                         <Image
                            src={src}
                            alt={alt || 'image'}
                            width={800} // Adjust as necessary
                            height={500} // Adjust as necessary
                            className="cursor-pointer"
                            onClick={() => handleImageClick(src, alt)}
                         />
                    )
                }
            }
        });
    };
    // 포스트가 없는 경우 기본값 설정
    const postTitle = post?.title || '제목 없음';
    const postTags = post?.tags || [];
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
                                tags={postTags.map(tag => ({
                                    id: tag.id,
                                    name: tag.name || '' // name이 undefined일 경우 빈 문자열로 대체
                                }))}
                                date={postDate}
                                readingTime={readingTime}
                            />
                          </div>
                        <Card className="w-full bg-transparent border-none shadow-none p-0 ">
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none">
                                     {renderContent(post.html || '')}
                                </div>
                            </CardContent>
                        </Card>
                         <EditorInfo authorIds={post.authors?.map(author => author.id)} />
                        <RelatedArticles currentPostTags={post.tags || []} currentPostSlug={slug} />
                    </div>
                )}
            </main>
            <Footer />
             <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                  <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                  <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none overflow-hidden">
                        {selectedImage && (
                            <div className="relative flex flex-col justify-center items-center">
                                <button
                                    onClick={handleCloseImageDialog}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <Image
                                   src={selectedImage.src}
                                    alt={selectedImage.alt || 'enlarged image'}
                                    width={1200}
                                    height={900}
                                    className="max-h-[80vh] object-contain"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
        </div>
    );
}