import { NextResponse } from 'next/server';
import redis from '@/lib/redis'; // Redis 클라이언트 import

const GHOST_URL = process.env.NEXT_PUBLIC_GHOST_URL;
const GHOST_KEY = process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
const CACHE_TTL_SECONDS = 10 * 60; // 10분 캐시 (태그는 더 길게)

export async function GET(request: Request) {
  if (!GHOST_URL || !GHOST_KEY) {
    return NextResponse.json({ error: 'Ghost API URL or Key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const cacheKey = `ghost:tags:browse:${searchParams.toString()}`;

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

  // 2. 캐시 없으면 API 직접 호출 (fetch 사용)
  try {
    const apiUrl = new URL(`${GHOST_URL}/ghost/api/content/tags/`);
    apiUrl.searchParams.set('key', GHOST_KEY);
    searchParams.forEach((value, key) => {
        if (['limit', 'order', 'filter', 'fields', 'include'].includes(key)) {
            apiUrl.searchParams.set(key, value);
        }
    });

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error(`Ghost API Error (browseTags): ${response.status}`, errorData);
      return NextResponse.json({ error: `Failed to fetch tags: ${response.statusText}`, details: errorData }, { status: response.status });
    }

    const freshData = await response.json();

    // 3. Redis에 저장
    if (redis) {
      try {
        // 태그 응답은 바로 사용
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(freshData.tags));
      } catch (error) {
        console.error('Redis SETEX Error (browseTags):', error);
      }
    }

    // API 응답의 tags 배열을 반환 (클라이언트 호환성)
    return NextResponse.json(freshData.tags || []);

  } catch (error) {
    console.error('API Route Error (browseTags):', error);
    return NextResponse.json({ error: 'Internal Server Error while fetching tags' }, { status: 500 });
  }
} 