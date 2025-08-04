// app/feed.xml/route.ts
import { getPosts } from '@/lib/markdown';
import type { PostOrPage } from '@/lib/types';

export async function GET() {
  try {
    const posts = await getPosts({ start: 0, limit: 20 });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greedient.kr';
    
    const rssItems = posts
      .filter((post: PostOrPage) => !post.draft)
      .map((post: PostOrPage) => {
        const pubDate = new Date(post.date).toUTCString();
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
      <link>${siteUrl}/${post.type === 'article' ? 'article' : 'post'}/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/${post.type === 'article' ? 'article' : 'post'}/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${post.category || '기술'}]]></category>
      ${post.feature_image ? `<enclosure url="${post.feature_image}" type="image/jpeg" />` : ''}
    </item>`;
      }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Greedient - 기술 트렌드와 인사이트</title>
    <description>최신 기술 트렌드, AI, 개발, 비즈니스 인사이트를 제공하는 블로그입니다.</description>
    <link>${siteUrl}</link>
    <language>ko-KR</language>
    <managingEditor>admin@greedient.kr (관리자)</managingEditor>
    <webMaster>admin@greedient.kr (관리자)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>
    <image>
      <url>${siteUrl}/logo.webp</url>
      <title>Greedient</title>
      <link>${siteUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${rssItems}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('RSS feed generation error:', error);
    return new Response('RSS feed generation failed', { status: 500 });
  }
}
