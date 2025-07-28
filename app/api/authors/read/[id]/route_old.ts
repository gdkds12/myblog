import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

const GHOST_URL = process.env.NEXT_PUBLIC_GHOST_URL;
const GHOST_KEY = process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
const CACHE_TTL_SECONDS = 60 * 60; // 1시간 캐시 (작성자 정보는 자주 안 바뀜)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!GHOST_URL || !GHOST_KEY) {
    return NextResponse.json({ error: 'Ghost API URL or Key not configured' }, { status: 500 });
  }

  const authorId = params.id;
  if (!authorId) {
    return NextResponse.json({ error: 'Author ID parameter is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const optionsIdentifier = `${searchParams.get('include') || ''}-${searchParams.get('fields') || ''}`;
  const cacheKey = `ghost:authors:read:${authorId}:${optionsIdentifier}`;

  // 1. 캐시 확인
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache HIT] readAuthor: ${cacheKey}`);
        return NextResponse.json(JSON.parse(cachedData));
      }
      console.log(`[Cache MISS] readAuthor: ${cacheKey}`);
    } catch (error) {
      console.error('Redis GET Error (readAuthor):', error);
    }
  }

  // 2. 캐시 없으면 API 직접 호출 (fetch 사용)
  try {
    const apiUrl = new URL(`${GHOST_URL}/ghost/api/content/authors/${authorId}/`);
    apiUrl.searchParams.set('key', GHOST_KEY);
    searchParams.forEach((value, key) => {
      if (['include', 'fields'].includes(key)) {
          apiUrl.searchParams.set(key, value);
      }
    });

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error(`Ghost API Error (readAuthor - ${authorId}): ${response.status}`, errorData);
      const errorMessage = response.status === 404 ? 'Author not found' : `Failed to fetch author: ${response.statusText}`;
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: response.status });
    }

    const freshData = await response.json();
    const authorData = freshData.authors && freshData.authors.length > 0 ? freshData.authors[0] : null;

    // 3. Redis에 저장
    if (redis && authorData) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(authorData));
      } catch (error) {
        console.error('Redis SETEX Error (readAuthor):', error);
      }
    }

    return NextResponse.json(authorData || {}); // 작성자 정보 또는 빈 객체 반환

  } catch (error) {
    console.error(`API Route Error (readAuthor - ${authorId}):`, error);
    return NextResponse.json({ error: 'Internal Server Error while fetching author' }, { status: 500 });
  }
} 