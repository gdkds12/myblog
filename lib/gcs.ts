// lib/gcs.ts - Google Cloud Storage 유틸리티
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || '');

export interface UploadOptions {
  destination: string;
  metadata?: Record<string, string>;
  makePublic?: boolean;
}

/**
 * 파일을 GCS에 업로드
 * @param fileBuffer 파일 버퍼
 * @param options 업로드 옵션
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  options: UploadOptions
): Promise<string> {
  const { destination, metadata = {}, makePublic = true } = options;

  const file = bucket.file(destination);

  try {
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(destination),
        cacheControl: 'public, max-age=31536000', // 1년 캐시
        ...metadata,
      },
      public: makePublic,
      validation: 'md5',
    });

    if (makePublic) {
      await file.makePublic();
    }

    // CDN URL이 설정되어 있으면 CDN URL 반환, 아니면 GCS 직접 URL
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
    if (cdnUrl) {
      return `${cdnUrl}/${destination}`;
    }

    return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destination}`;
  } catch (error) {
    console.error('GCS upload error:', error);
    throw new Error(`Failed to upload to GCS: ${error}`);
  }
}

/**
 * GCS에서 파일 삭제
 * @param filename 삭제할 파일명
 */
export async function deleteFromGCS(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('GCS delete error:', error);
    throw new Error(`Failed to delete from GCS: ${error}`);
  }
}

/**
 * 파일 확장자에 따른 Content-Type 결정
 * @param filename 파일명
 * @returns Content-Type
 */
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * 이미지 URL 최적화 (CDN 사용)
 * @param originalUrl 원본 이미지 URL
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 URL
 */
export function optimizeImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'avif' | 'webp' | 'jpg';
  } = {}
): string {
  // CDN 최적화 비활성화 - 원본 URL 그대로 반환
  return originalUrl;
}

/**
 * 마크다운 내용에서 이미지 URL들을 추출하고 최적화
 * @param markdown 마크다운 내용
 * @returns 최적화된 마크다운 내용
 */
export function optimizeMarkdownImages(markdown: string): string {
  // 최적화 비활성화 - 원본 마크다운 그대로 반환
  return markdown;
}
