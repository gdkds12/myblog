import { Metadata } from 'next';
import { getPostBySlug } from '@/lib/strapi';

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
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: canonical,
      images: post.feature_image ? [{ url: post.feature_image }] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.feature_image ? [post.feature_image] : undefined,
    },
  };
}
