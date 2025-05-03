import { NextResponse } from 'next/server';
import redis from '@/lib/redis'; // Redis 클라이언트 import

const GHOST_URL = process.env.NEXT_PUBLIC_GHOST_URL;
const GHOST_KEY = process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
const CACHE_TTL_SECONDS = 5 * 60; // 5분 캐시

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  if (!GHOST_URL || !GHOST_KEY) {
    return NextResponse.json({ error: 'Ghost API URL or Key not configured' }, { status: 500 });
  }

  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  // include, fields 파라미터도 캐시 키에 포함
  const optionsIdentifier = `${searchParams.get('include') || ''}-${searchParams.get('fields') || ''}`;
  const cacheKey = `ghost:posts:read:${slug}:${optionsIdentifier}`;

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

  // 2. 캐시 없으면 API 직접 호출 (fetch 사용)
  try {
    const apiUrl = new URL(`${GHOST_URL}/ghost/api/content/posts/slug/${slug}/`);
    apiUrl.searchParams.set('key', GHOST_KEY);
     // 원본 요청의 파라미터를 Ghost API 파라미터로 변환하여 추가
    searchParams.forEach((value, key) => {
        if (['include', 'fields'].includes(key)) {
            apiUrl.searchParams.set(key, value);
        }
    });

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
        // Ghost API의 404는 여기서 처리될 것임
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error(`Ghost API Error (readPost - ${slug}): ${response.status}`, errorData);
      // 404 에러 메시지를 좀 더 명확하게
      const errorMessage = response.status === 404 ? 'Post not found' : `Failed to fetch post: ${response.statusText}`;
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: response.status });
    }

    const freshData = await response.json();

    // 3. Redis에 저장
    if (redis) {
        try {
          // API 응답 구조가 posts 배열일 수 있으므로 첫 번째 요소 사용 (Ghost API v5 기준)
          const postData = freshData.posts && freshData.posts.length > 0 ? freshData.posts[0] : null;
          if (postData) {
             await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(postData));
          } else {
             console.warn(`No post data found in response for slug: ${slug}`);
          }
        } catch (error) {
          console.error('Redis SETEX Error (readPost):', error);
        }
      }

    // API 응답의 posts 배열의 첫 번째 요소를 반환 (클라이언트 호환성)
    return NextResponse.json(freshData.posts && freshData.posts.length > 0 ? freshData.posts[0] : {});

  } catch (error) {
    console.error(`API Route Error (readPost - ${slug}):`, error);
    return NextResponse.json({ error: 'Internal Server Error while fetching post' }, { status: 500 });
  }
} 