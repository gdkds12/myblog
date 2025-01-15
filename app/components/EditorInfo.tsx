// app/components/EditorInfo.tsx
"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/ghost';
import Image from 'next/image';
import { Author, PostOrPage } from '@tryghost/content-api';
import { useTheme } from 'next-themes';

interface EditorInfoProps {
  authorIds: string[] | undefined;
}

// Author 인터페이스의 속성을 모두 가지고 slug 속성만 옵셔널하게 추가합니다.
interface AuthorWithSlug extends Omit<Author, 'slug'> {
  slug?: string;
}

// PostOrPage 인터페이스를 확장하되 authors 속성의 타입을 명시적으로 지정합니다.
interface PostWithAuthors extends PostOrPage {
    authors?: (Author & { slug?: string; })[] | undefined;
}


const EditorInfo: React.FC<EditorInfoProps> = ({ authorIds }) => {
  const [author, setAuthor] = useState<AuthorWithSlug | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();


  useEffect(() => {
    const fetchAuthor = async () => {
      setIsLoading(true);
      try {
        if (!authorIds || authorIds.length === 0) {
          setAuthor(null);
          setIsLoading(false);
          return;
        }

        // 첫 번째 저자만 가져오도록 수정
        const firstAuthorId = authorIds[0];
        const fetchedAuthor = await api.authors.read({ id: firstAuthorId });
           
        setAuthor(fetchedAuthor);

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching author:', error);
        setError("Failed to load editor info.");
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