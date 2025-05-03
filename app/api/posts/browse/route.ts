import { NextResponse } from 'next/server';
import redis from '@/lib/redis'; // Redis 클라이언트 import

const GHOST_URL = process.env.NEXT_PUBLIC_GHOST_URL;
const GHOST_KEY = process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
const CACHE_TTL_SECONDS = 5 * 60; // 5분 캐시

export async function GET(request: Request) {
  if (!GHOST_URL || !GHOST_KEY) {
    return NextResponse.json({ error: 'Ghost API URL or Key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const cacheKey = `ghost:posts:browse:${searchParams.toString()}`;

  // 1. 캐시 확인
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache HIT] browsePosts: ${cacheKey}`);
        // 캐시된 데이터는 이미 posts 배열일 것으로 가정하고 반환
        return NextResponse.json(JSON.parse(cachedData));
      }
      console.log(`[Cache MISS] browsePosts: ${cacheKey}`);
    } catch (error) {
      console.error('Redis GET Error (browsePosts):', error);
      // 레디스 오류 시 캐시 건너뛰고 진행
    }
  }

  // 2. 캐시 없으면 API 직접 호출 (fetch 사용)
  try {
    const apiUrl = new URL(`${GHOST_URL}/ghost/api/content/posts/`);
    apiUrl.searchParams.set('key', GHOST_KEY);
    // 원본 요청의 파라미터를 Ghost API 파라미터로 변환하여 추가
    searchParams.forEach((value, key) => {
        // content-api는 limit, page, order, filter, fields, include 등을 지원
        if (['limit', 'page', 'order', 'filter', 'fields', 'include'].includes(key)) {
             apiUrl.searchParams.set(key, value);
        }
    });

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error(`Ghost API Error (browsePosts): ${response.status}`, errorData);
      return NextResponse.json({ error: `Failed to fetch posts: ${response.statusText}`, details: errorData }, { status: response.status });
    }

    const freshData = await response.json(); // 전체 응답 객체
    const postsArray = freshData.posts || []; // posts 배열 추출 (없으면 빈 배열)

    // 3. Redis에 저장 (posts 배열만 저장)
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(postsArray));
      } catch (error) {
        console.error('Redis SETEX Error (browsePosts):', error);
      }
    }

    // posts 배열 반환
    return NextResponse.json(postsArray);

  } catch (error) {
    console.error('API Route Error (browsePosts):', error);
    return NextResponse.json({ error: 'Internal Server Error while fetching posts' }, { status: 500 });
  }
} 