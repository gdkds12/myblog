import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { getPostBySlug } from '@/lib/strapi';


const CACHE_TTL_SECONDS = 60 * 60; // 1시간 캐시

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {


  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  // include, fields 파라미터도 캐시 키에 포함
  const optionsIdentifier = `${searchParams.get('include') || ''}-${searchParams.get('fields') || ''}`;
  const cacheKey = `strapi:posts:read:${slug}`;

  // 1. 캐시 확인
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache HIT] readPost: ${cacheKey}`);
        return NextResponse.json(JSON.parse(cachedData));
      }
      console.log(`[Cache MISS] readPost: ${cacheKey}`);
    } catch (error) {
      console.error('Redis GET Error (readPost):', error);
    }
  }

  // 2. 캐시 없으면 Strapi 호출
  try {
    const postData = await getPostBySlug(slug);
    if (!postData) {
      // 캐시에 존재하던 삭제된 글 제거
      if (redis) {
        try {
          const browseKeys = await redis.keys('strapi:posts:browse:*');
          const listKeys = await redis.keys('posts:list:*');
          const keysToCheck = [...browseKeys, ...listKeys];
          for (const bk of keysToCheck) {
            const cached = await redis.get(bk);
            if (!cached) continue;
            const arr = JSON.parse(cached) as any[];
            const filtered = arr.filter(p => p.slug !== slug);
            if (filtered.length !== arr.length) {
              await redis.set(bk, JSON.stringify(filtered));
            }
          }
          // read 캐시도 혹시 모르게 제거
          await redis.del(cacheKey);
        } catch (e) {
          console.error('Purge deleted post cache error:', e);
        }
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    // 3. Redis에 저장
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(postData));
        // 목록 관련 캐시 무효화 – 다음 요청에서 최신 데이터 로드
        const listKeys = await redis.keys('posts:list:*');
        const browseKeys = await redis.keys('strapi:posts:browse:*');
        if (listKeys.length || browseKeys.length) {
          await redis.del(...listKeys, ...browseKeys);
        }
      } catch (error) {
        console.error('Redis SETEX Error (readPost):', error);
      }
    }
    return NextResponse.json(postData);
  } catch (error) {
    console.error(`API Route Error (readPost - ${slug}):`, error);
    return NextResponse.json({ error: 'Internal Server Error while fetching post' }, { status: 500 });
  }
} 