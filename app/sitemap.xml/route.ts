import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greedient.kr';

export async function GET() {
  // Static routes with priorities
  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/articles', priority: '0.9', changefreq: 'daily' }
  ];

  const urls: Array<{ url: string; lastmod?: string; priority: string; changefreq: string }> = [...staticRoutes];

  // Dynamic post and article pages
  try {
    const posts = await (await import('@/lib/markdown')).getPosts({ limit: 500 });
    posts.forEach((post: any) => {
      if (post.slug && !post.draft) {
        // 게시물 날짜를 lastmod로 사용
        const lastmod = post.date || post.published_at || new Date().toISOString().split('T')[0];
        
        // 포스트 페이지
        urls.push({
          url: `/post/${post.slug}`,
          lastmod,
          priority: '0.8',
          changefreq: 'weekly'
        });
        
        // 아티클 태그가 있으면 아티클 페이지도 추가
        if (post.tags?.some((tag: string) => tag === 'article')) {
          urls.push({
            url: `/article/${post.slug}`,
            lastmod,
            priority: '0.8',
            changefreq: 'weekly'
          });
        }
      }
    });
  } catch (e) {
    console.error('[sitemap] failed to fetch posts', e);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastmod, priority, changefreq }) => `  <url>
    <loc>${BASE_URL}${url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600' // 1시간 캐시
    }
  });
}
