/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['three', '@react-three/fiber'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};
export default nextConfig;
