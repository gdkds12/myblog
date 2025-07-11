/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'grounded-rainbow-3b0e27f8c5.media.strapiapp.com', // Strapi CDN
    ],
    unoptimized: true, // 전체 이미지 최적화 비활성화하여 원본 전달
    dangerouslyAllowSVG: true, // SVG 허용
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

};

module.exports = nextConfig;