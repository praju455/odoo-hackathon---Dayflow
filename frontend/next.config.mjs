/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  agentRules: false,
  eslint: {
    // Lint errors won't fail the production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors won't fail the production build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
