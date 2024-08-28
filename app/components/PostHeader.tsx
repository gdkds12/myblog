// components/PostHeader.tsx

"use client"; // 클라이언트 측 렌더링을 위해 추가

import { useRouter } from 'next/navigation';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import readingTime from 'reading-time';

interface PostHeaderProps {
    title: string;
    tags: Array<{ id: string; name: string }>;
    featureImage?: string;
}

const PostHeader: React.FC<PostHeaderProps> = ({ title, tags, featureImage }) => {
    const router = useRouter();
    const readingStats = readingTime(featureImage || '').text;

    return (
        <CardHeader>
            <button
                onClick={() => router.push('/')}
                className="flex items-center text-sm mb-4 hover:underline"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                블로그로 돌아가기
            </button>
            <CardTitle className="text-4xl md:text-5xl font-semibold mb-4">{title}</CardTitle> {/* 제목과 태그 사이 패딩 추가 */}
            <div className="flex items-center text-sm text-gray-500 py-2 mb-6"> {/* 태그 아래 패딩 추가 */}
                <div className="flex flex-wrap gap-2">
                    {tags && tags.map((tag) => (
                        <span key={tag.id} className="px-3 py-1 text-sm bg-gray-800 bg-opacity-80 dark:bg-gray-600 dark:bg-opacity-80 text-white rounded-full">
                            {tag.name || ''}
                        </span>
                    ))}
                </div>
                <span className="ml-4">{readingStats}</span>
            </div>
            {featureImage && (
                <img
                    src={featureImage}
                    alt={title}
                    className="w-full h-auto object-cover rounded-lg mt-4"
                />
            )}
        </CardHeader>
    );
};

export default PostHeader;
