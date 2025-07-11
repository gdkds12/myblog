import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { getPostBySlug } from '@/lib/strapi';
import qs from 'qs';


const CACHE_TTL_SECONDS = 60 * 60; // Redis 키 TTL (실제 만료는 길게)
const STALE_THRESHOLD_SECONDS = 30; // 30초 이내면 최신, 이후에는 백그라운드 리프레시

async function refreshInBackground(slug: string, cacheKey: string) {
  // 중복 갱신 방지용 Lock (10초)
  const lockKey = `${cacheKey}:lock`;
  // Redis v3 호환 – "SET key value NX EX 10"
  const acquired = await (redis as any)?.set(lockKey, '1', 'NX', 'EX', 10);
  if (acquired !== 'OK') return; // 누군가 이미 갱신 중

  try {
    const cachedRaw = await redis?.get(cacheKey);
    const cached: any = cachedRaw ? JSON.parse(cachedRaw) : null;
    const current = cached?.data;

    // 1단계: updatedAt만 조회(경량)
    const query = qs.stringify({
      fields: ['updatedAt','updated_at','publishedAt','published_at'],
      filters: { slug: { $eq: slug } },
      publicationState: 'live',
      pagination: { limit: 1 },
    }, { encodeValuesOnly: true, arrayFormat: 'indices' });
    const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_CMS_URL;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(process.env.STRAPI_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` } : {}),
    };
    let freshUpdated: string | null = null;
    try {
      const tsRes = await fetch(`${STRAPI_URL}/api/articles?${query}`, { headers });
      if (tsRes.ok) {
        const tsJson = await tsRes.json();
        const meta = tsJson?.data?.[0]?.attributes ?? {};
        freshUpdated = meta.updatedAt ?? meta.updated_at ?? meta.publishedAt ?? meta.published_at ?? null;
      }
    } catch(err){
      if (process.env.NODE_ENV !== 'production') {
        console.warn('timestamp lightweight query failed, will fallback to full fetch', err);
      }
    }

    const cachedUpdated = (current as any)?.updatedAt ?? (current as any)?.updated_at ?? (current as any)?.publishedAt ?? (current as any)?.published_at;
    if (freshUpdated && cachedUpdated === freshUpdated) {
      // 변경 없음 → fetchedAt만 갱신
      await redis?.set(cacheKey, JSON.stringify({ data: current, fetchedAt: Date.now() }));
      return;
    }

    // 2단계: 실제 본문 전체 fetch
    const fresh = await getPostBySlug(slug);
    if (!fresh) return;
    await redis?.set(cacheKey, JSON.stringify({ data: fresh, fetchedAt: Date.now() }));
  } catch (err) {
    console.error('Background refresh error:', err);
    // 실패 시 전체 fetch로 시도 (네트워크/400 에러 등)
    try {
      const fresh = await getPostBySlug(slug);
      if (fresh) {
        await redis?.set(cacheKey, JSON.stringify({ data: fresh, fetchedAt: Date.now() }));
      }
    } catch(e){
      console.error('Fallback full fetch failed:', e);
    }
  } finally {
    // lock 해제
    await redis?.del(`${cacheKey}:lock`).catch(() => {});
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
  // include & fields 파라미터까지 키에 반영 (충돌 방지)
  const paramsStr = searchParams.toString();
  const cacheKey = `strapi:posts:read:${slug}:${paramsStr}`;

  // 1. 캐시 확인
  if (redis) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const payload = parsed.data ?? parsed; // 구버전 호환
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

  // 2. 캐시 없으면(또는 Redis 미사용) Strapi 호출
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
        await redis.set(cacheKey, JSON.stringify({ data: postData, fetchedAt: Date.now() }));
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