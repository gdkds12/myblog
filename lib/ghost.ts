import GhostContentAPI from '@tryghost/content-api';

// 환경 변수 확인: URL과 Content API 키는 필수
if (!process.env.NEXT_PUBLIC_GHOST_URL || !process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
  throw new Error('Ghost API URL and Content API Key must be set in environment variables');
}

// Ghost Content API 클라이언트 초기화
const api = new GhostContentAPI({
  url: process.env.NEXT_PUBLIC_GHOST_URL!,
  key: process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY!,
  version: "v5.0"
});

export default api;
