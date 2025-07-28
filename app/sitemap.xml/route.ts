import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export async function GET() {
  // Collect static routes
  const urls: string[] = ['/', '/articles'];

  // Dynamic post and article pages
  try {
    const posts = await (await import('@/lib/markdown')).getPosts({ limit: 500 });
    posts.forEach((p: any) => {
      if (p.slug) urls.push(`/post/${p.slug}`);
      if (p.tags?.some((t: any) => t.slug === 'article')) {
        urls.push(`/article/${p.slug}`);
      }
    });
  } catch (e) {
    console.error('[sitemap] failed to fetch posts', e);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${BASE_URL}${u}</loc></url>`).join('\n') +
    `\n</urlset>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
