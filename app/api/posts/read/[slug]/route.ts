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
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    // 3. Redis에 저장
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(postData));
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