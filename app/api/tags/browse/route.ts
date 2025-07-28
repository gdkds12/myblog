import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { getTags } from '@/lib/markdown';

// ISR 캐시 설정
export const revalidate = 3600; // 1시간마다 재검증  
export const dynamic = 'force-static'; // 가능한 한 정적으로 처리

const CACHE_TTL_SECONDS = 60 * 60; // Redis 키 TTL
const STALE_THRESHOLD_SECONDS = 30; // 30초 이내면 새로고침 안 함

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = `markdown:tags:browse:${searchParams.toString()}`;

  // 1. 캐시 확인
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache HIT] browseTags: ${cacheKey}`);
        return NextResponse.json(JSON.parse(cachedData));
      }
      console.log(`[Cache MISS] browseTags: ${cacheKey}`);
    } catch (error) {
      console.error('Redis GET Error (browseTags):', error);
    }
  }

  // 2. 캐시 없으면 마크다운에서 태그 추출
  try {
    const limit = searchParams.get('limit');
    const tagsLimit = limit ? parseInt(limit) : 'all';
    const tags = await getTags(tagsLimit);

    // 3. Redis에 저장
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(tags));
      } catch (error) {
        console.error('Redis SETEX Error (browseTags):', error);
      }
    }

    return NextResponse.json(tags);
  } catch (error) {
    console.error('API Route Error (browseTags):', error);
    return NextResponse.json({ error: 'Internal Server Error while fetching tags' }, { status: 500 });
  }
}
