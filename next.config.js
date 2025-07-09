/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['grounded-rainbow-3b0e27f8c5.strapiapp.com', 'res.cloudinary.com'],
    remotePatterns: [
        {
            protocol: 'http',
            hostname: '*',
        },
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
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
  experimental: {
    legacyBrowsers: false, // ES6+ only → 레거시 폴리필 제거
  },
};

module.exports = nextConfig;