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

// Structured data JSON-LD
export default async function Head({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const canonical = `${baseUrl}/article/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.published_at || undefined,
    image: post.feature_image ? [post.feature_image] : undefined,
    url: canonical,
    description: post.excerpt || undefined,
  } as const;

  return (
    <script
      key="ld-json"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
