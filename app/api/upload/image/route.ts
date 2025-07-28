// app/api/upload/image/route.ts - 이미지 업로드 API
import { NextRequest, NextResponse } from 'next/server';
import { uploadToGCS } from '@/lib/gcs';

// 동적 라우트로 설정하여 빌드 시 실행 방지
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // GCS 설정 확인
    if (!process.env.GCS_PROJECT_ID || !process.env.GCS_BUCKET_NAME) {
      return NextResponse.json(
        { error: 'GCS is not configured on this server' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // 허용된 파일 타입 확인
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      );
    }

    // 파일을 버퍼로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const filename = `images/${timestamp}-${file.name}`;

    // GCS에 업로드
    const url = await uploadToGCS(buffer, {
      destination: filename,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
      makePublic: true,
    });

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// 업로드된 이미지 삭제 API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'No filename provided' },
        { status: 400 }
      );
    }

    // 보안상 images/ 디렉토리 내의 파일만 삭제 허용
    if (!filename.startsWith('images/')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const { deleteFromGCS } = await import('@/lib/gcs');
    await deleteFromGCS(filename);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
