// app/api/revalidate/route.ts - 수동 캐시 무효화 API
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const path = searchParams.get('path');
    const tag = searchParams.get('tag');

    // 보안을 위한 시크릿 키 확인
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // Redis 캐시 클리어
    if (redis) {
      try {
        const pattern = 'markdown:posts:*';
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`Cleared ${keys.length} cache keys`);
        }
      } catch (error) {
        console.error('Error clearing Redis cache:', error);
      }
    }

    // Next.js 캐시 무효화
    if (path) {
      revalidatePath(path);
      console.log(`Revalidated path: ${path}`);
    }

    if (tag) {
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    }

    // 주요 페이지들 무효화
    revalidatePath('/');
    revalidatePath('/articles');
    revalidatePath('/api/posts/browse');

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path,
      tag 
    });

  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}
