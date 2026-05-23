/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // xlsx needs to run in Node.js (not the Edge runtime) for binary file parsing
    serverComponentsExternalPackages: ["xlsx"],
  },
};

export default nextConfig;
