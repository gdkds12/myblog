import { Metadata } from 'next';
import { getPostBySlug } from '@/lib/markdown';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: '아티클을 찾을 수 없습니다',
    };
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const canonical = `${baseUrl}/article/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt || undefined,
    keywords: post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean).join(', ') || 'article, technology, blog',
    authors: [{ name: post.author || '관리자' }],
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: canonical,
      siteName: 'Greedient',
      images: post.feature_image ? [{ 
        url: post.feature_image,
        width: 1200,
        height: 630,
        alt: post.title 
      }] : undefined,
      type: 'article',
      publishedTime: post.date ? new Date(post.date).toISOString() : undefined,
      modifiedTime: post.updated_at ? new Date(post.updated_at).toISOString() : undefined,
      authors: [post.author || '관리자'],
      tags: post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.feature_image ? [post.feature_image] : undefined,
    },
    robots: {
      index: !post.draft,
      follow: !post.draft,
    },
  };
}
