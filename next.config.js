/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'storage.googleapis.com', // GCS bucket
      'lh3.googleusercontent.com', // Google CDN
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