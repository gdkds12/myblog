import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { getPosts } from '@/lib/strapi';


const CACHE_TTL_SECONDS = 5 * 60; // 5분 캐시

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '10');
  const page = Number(searchParams.get('page') ?? '1');
  const tagSlug = searchParams.get('tag'); // optional tag filter
  const start = (page - 1) * limit;
  const cacheKey = `strapi:posts:browse:${start}:${limit}:${tagSlug ?? 'all'}`;




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

   // 2. 캐시 없으면 Strapi 호출
   try {
     let postsArray = await getPosts({ start, limit });
      if (tagSlug) {
        postsArray = postsArray.filter((post: any) => post.tags?.some((t: any) => t.slug === tagSlug));
      }
     // 3. Redis에 저장 (posts 배열만 저장)
     if (redis) {
       try {
         await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(postsArray));
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