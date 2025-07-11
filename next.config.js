/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'grounded-rainbow-3b0e27f8c5.media.strapiapp.com', // Strapi CDN
    ],
    // remotePatterns 제거 -> domains 목록만 사용
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