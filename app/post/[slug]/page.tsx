// app/post/[slug]/page-server.tsx - Server Component version with ISR
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/markdown';
import PostClientComponent from './PostClientComponent';

// ISR 설정 - 새로운 파일을 빠르게 감지하기 위해 짧은 간격으로 설정
export const revalidate = 60; // 1분마다 재검증 (새 파일 빠른 감지)
export const dynamic = 'force-static'; // 가능한 한 정적으로 처리
export const dynamicParams = true; // 새로운 슬러그에 대해 동적으로 페이지 생성

type Props = {
  params: { slug: string };
};

// 정적 페이지 생성을 위한 generateStaticParams
export async function generateStaticParams() {
  try {
    const posts = await getPosts({ limit: 100 }); // 상위 100개 포스트만 빌드 시 생성
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// 메타데이터 생성
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await getPostBySlug(params.slug);
    
    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    return {
      title: post.title,
      description: post.excerpt || undefined,
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        images: post.feature_image ? [post.feature_image] : [],
        type: 'article',
        publishedTime: post.published_at,
        authors: [post.author || 'Admin'],
                tags: post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).filter((tag): tag is string => Boolean(tag)) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || undefined,
        images: post.feature_image ? [post.feature_image] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error Loading Post',
    };
  }
}

// 서버 컴포넌트
export default async function PostPage({ params }: Props) {
  try {
    const post = await getPostBySlug(params.slug);
    
    if (!post) {
      notFound();
    }

    // 서버에서 데이터를 가져와서 클라이언트 컴포넌트에 전달
    return <PostClientComponent initialPost={post} slug={params.slug} />;
  } catch (error) {
    console.error('Error loading post:', error);
    notFound();
  }
}
