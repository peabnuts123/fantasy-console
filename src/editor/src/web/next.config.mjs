/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  transpilePackages: [
    '@fantasy-console/runtime',
    '@fantasy-console/core',
  ],
};

export default nextConfig;
