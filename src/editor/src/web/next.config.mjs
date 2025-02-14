/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  transpilePackages: [
    '@polyzone/runtime',
    '@polyzone/core',
  ],
};

export default nextConfig;
