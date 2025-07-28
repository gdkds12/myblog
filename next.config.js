/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      '34.111.238.251', // CDN IP 주소 (실제 사용 중)
      'via.placeholder.com', // 플레이스홀더 이미지
      'picsum.photos', // 테스트 이미지
    ],
    formats: ['image/avif', 'image/webp'], // 최적화된 이미지 포맷
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐시
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true, // SVG 허용
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer }) => {
      if (!isServer) {
          config.resolve.fallback = { fs: false, net: false, tls: false };
      }
      return config;
  },
  reactStrictMode: true,
  // Docker 배포를 위한 설정 추가
  output: 'standalone',
  // ISR과 캐싱 최적화
  experimental: {
    staleTimes: {
      dynamic: 30, // 동적 페이지 30초 캐시
      static: 180, // 정적 페이지 3분 캐시
    },
  },
  // CDN과 성능 최적화
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // 캐시 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=31536000, stale-while-revalidate=59',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=300, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;