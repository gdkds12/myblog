/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      remotePatterns: [
      {
        protocol: 'http',
        hostname: 'seongyo.pe.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
  reactStrictMode: true,
};

module.exports = nextConfig;