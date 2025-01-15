// app/components/ArticlePostHeader.tsx
import React from 'react';

interface ArticlePostHeaderProps {
    title: string;
    tags: { id: string; name: string }[];
    date?: string;
    readingTime?: string | number | undefined;
}

const ArticlePostHeader: React.FC<ArticlePostHeaderProps> = ({ title, tags, date = '', readingTime }) => {
    const readingTimeText = readingTime ? String(readingTime) : '';

    return (
        <div className="flex flex-col items-center justify-center">
            {/* 제목 */}
            <h1 className="text-3xl md:text-5xl font-medium text-center mb-8"> {/* mb-4 -> mb-8 로 변경 */}
                {title}
            </h1>
            {/* 날짜와 읽는 시간 */}
            <div className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                <span>{date}</span>
                <span className="ml-2">·</span>
                <span className="ml-2">{readingTimeText}</span>
            </div>
            {/* 태그 */}
            {tags && tags.length > 0 && (
                <div className="flex flex-wrap justify-center mt-4">
                    {tags.map((tag) => (
                        <span
                            key={tag.id}
                            className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 mb-2"
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArticlePostHeader;