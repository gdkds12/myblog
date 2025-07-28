import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { getPostBySlug } from '@/lib/markdown';

const CACHE_TTL_SECONDS = 60 * 60; // Redis 키 TTL
const STALE_THRESHOLD_SECONDS = 30; // 30초 이내면 새로고침 안 함

async function refreshInBackground(slug: string, cacheKey: string) {
  const lockKey = `${cacheKey}:lock`;
  const acquired = await (redis as any)?.set(lockKey, '1', 'NX', 'EX', 10);
  if (acquired !== 'OK') return;

  try {
    // 마크다운 파일에서 최신 데이터 읽기
    const freshData = await getPostBySlug(slug);
    if (freshData) {
      await redis?.set(cacheKey, JSON.stringify({ data: freshData, fetchedAt: Date.now() }));
    }
  } catch (error) {
    console.error('Background refresh failed:', error);
  } finally {
    await redis?.del(lockKey);
  }
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const paramsStr = searchParams.toString();
  const cacheKey = `markdown:posts:read:${slug}:${paramsStr}`;

  // 1. 캐시 확인
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const payload = parsed.data ?? parsed;
        const fetchedAt = parsed.fetchedAt ?? 0;
        const age = Date.now() - fetchedAt;

        if (age < STALE_THRESHOLD_SECONDS * 1000) {
          if (process.env.NODE_ENV !== 'production') console.log(`[Cache HIT fresh] readPost: ${cacheKey}`);
          return NextResponse.json(payload);
        }
        
        // Stale → 즉시 반환하고 백그라운드 리프레시
        if (process.env.NODE_ENV !== 'production') console.log(`[Cache HIT stale] readPost: ${cacheKey} – refreshing in background`);
        refreshInBackground(slug, cacheKey).catch(console.error);
        return NextResponse.json(payload);
      }
    } catch (error) {
      console.error('Redis GET Error (readPost):', error);
    }
    if (process.env.NODE_ENV !== 'production') console.log(`[Cache MISS] readPost: ${cacheKey}`);
  }

  // 2. 캐시 없으면 마크다운 파일에서 읽기
  try {
    const postData = await getPostBySlug(slug);
    if (!postData) {
      // 캐시에 존재하던 삭제된 글 제거
      if (redis) {
        try {
          const browseKeys = await redis.keys('markdown:posts:browse:*');
          const listKeys = await redis.keys('posts:list:*');
          const keysToCheck = [...browseKeys, ...listKeys];
          for (const bk of keysToCheck) {
            const cached = await redis.get(bk);
            if (!cached) continue;
            const arr = JSON.parse(cached) as any[];
            const filtered = arr.filter((p: any) => p.slug !== slug);
            if (filtered.length !== arr.length) {
              await redis.set(bk, JSON.stringify(filtered));
            }
          }
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
        await redis.set(cacheKey, JSON.stringify({ data: postData, fetchedAt: Date.now() }));
        // 목록 관련 캐시 무효화
        const listKeys = await redis.keys('posts:list:*');
        const browseKeys = await redis.keys('markdown:posts:browse:*');
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
