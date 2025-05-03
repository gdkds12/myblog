/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
};

module.exports = nextConfig;