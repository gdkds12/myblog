// app/components/EditorInfo.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Author } from '@/lib/types';
import { useTheme } from 'next-themes';

interface EditorInfoProps {
  authorIds: string[] | undefined;
}

// Author 인터페이스의 속성을 모두 가지고 slug 속성만 옵셔널하게 추가합니다.
interface AuthorWithSlug extends Omit<Author, 'slug'> {
  slug?: string;
}

const EditorInfo: React.FC<EditorInfoProps> = ({ authorIds }) => {
  const [author, setAuthor] = useState<AuthorWithSlug | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();


  useEffect(() => {
    const fetchAuthor = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!authorIds || authorIds.length === 0) {
          setAuthor(null);
          setIsLoading(false);
          return;
        }

        const firstAuthorId = authorIds[0];
        // API Route 호출로 변경
        const response = await fetch(`/api/authors/read/${firstAuthorId}`);
        if (!response.ok) {
             // 404 포함 에러 처리
             const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
             console.error(`Error fetching author ${firstAuthorId}: ${response.status}`, errorData);
             setError(`Failed to load editor info: ${response.statusText}`);
             setAuthor(null);
             setIsLoading(false);
             return;
        }
        const fetchedAuthor = await response.json();

        // API가 빈 객체를 반환할 수 있으므로 확인
        if (fetchedAuthor && Object.keys(fetchedAuthor).length > 0) {
             setAuthor(fetchedAuthor);
        } else {
            setAuthor(null); // 작성자 정보 없음
            console.warn(`Author not found or empty response for ID: ${firstAuthorId}`);
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching author:', error);
        setError("Failed to load editor info.");
        setAuthor(null);
        setIsLoading(false);
      }
    };

    fetchAuthor();
  }, [authorIds]);

  if (isLoading) {
    return <div className="text-lg">Loading editor info...</div>;
  }

  if (error) {
    return <div className="text-lg text-red-500">{error}</div>;
  }

  if (!author) {
      return null;
  }
  return (
      <>
    <div className={`flex items-center py-6 border-t border-gray-200 dark:border-gray-700`}>
      <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
        {author.profile_image && (
          <Image
            src={author.profile_image}
            alt={author.name || "Editor"}
            fill
            className="object-cover w-full h-full"
            unoptimized
          />
        )}
      </div>
      <div>
        <div className={`flex items-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="font-semibold mr-1">Editor</span>
        </div>
        <div className={`font-medium text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          {author.name}
        </div>
        {/* Location 정보를 보여주는 부분을 제거했습니다. */}
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Hongik University
        </div>
      </div>
    </div>
      <div className="border-b border-gray-200 dark:border-gray-700" />
      </>
  );
};

export default EditorInfo;