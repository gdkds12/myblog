import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { getPosts, getPostsByTag } from '@/lib/markdown';


const CACHE_TTL_SECONDS = 60 * 60; // Redis 키 TTL
const STALE_THRESHOLD_SECONDS = 30; // 30초 이내면 새로고침 안 함

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '10');
  const page = Number(searchParams.get('page') ?? '1');
  const tagSlug = searchParams.get('tag'); // optional tag filter
  const start = (page - 1) * limit;
  const cacheKey = `markdown:posts:browse:${start}:${limit}:${tagSlug ?? 'all'}`;




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
          console.log(`[Cache HIT fresh] browsePosts: ${cacheKey}`);
          return NextResponse.json(payload);
        }
        console.log(`[Cache HIT stale] browsePosts: ${cacheKey} – refreshing in background`);
        refreshListInBackground({ start, limit, tagSlug, cacheKey }).catch(console.error);
        return NextResponse.json(payload);
      }
      console.log(`[Cache MISS] browsePosts: ${cacheKey}`);
    } catch (error) {
      console.error('Redis GET Error (browsePosts):', error);
      // 레디스 오류 시 캐시 건너뛰고 진행
    } finally {
      // close try block
    }
  }

  // 2. 캐시 없으면 마크다운 파일 읽기
  try {
    let postsArray = tagSlug 
      ? await getPostsByTag(tagSlug, { start, limit })
      : await getPosts({ start, limit });

    // 3. Redis에 저장 (posts 배열 + 메타)
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify({ data: postsArray, fetchedAt: Date.now() }));
      } catch (error) {
        console.error('Redis SETEX Error (browsePosts):', error);
      }
    }

    return NextResponse.json(postsArray);
  } catch (error) {
    console.error('API Route Error (browsePosts):', error);
    return NextResponse.json({ error: 'Internal Server Error while fetching posts' }, { status: 500 });
  }
}

async function refreshListInBackground({ start, limit, tagSlug, cacheKey }: { start:number; limit:number; tagSlug:string|null; cacheKey:string }) {
  try {
    let fresh = tagSlug 
      ? await getPostsByTag(tagSlug, { start, limit })
      : await getPosts({ start, limit });
    await redis?.set(cacheKey, JSON.stringify({ data: fresh, fetchedAt: Date.now() }));
  } catch (e) {
    console.error('Background list refresh error:', e);
  }
}