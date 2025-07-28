import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authorId = params.id;
  if (!authorId) {
    return NextResponse.json({ error: 'Author ID parameter is required' }, { status: 400 });
  }

  // 마크다운 기반에서는 작성자 정보가 간단하므로 기본 구조만 반환
  const author = {
    id: authorId,
    name: authorId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    slug: authorId,
    profile_image: null,
    bio: null,
    website: null,
    location: null,
  };

  return NextResponse.json(author);
}
