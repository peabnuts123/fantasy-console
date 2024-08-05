/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@fantasy-console/runtime',
    '@fantasy-console/core',
  ]
};

export default nextConfig;
