/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal self-contained build under .next/standalone
  // Required for the Docker multi-stage pattern used in the HF Space
  output: 'standalone',

  // Allow images from any HTTPS origin (needed when running in HF Spaces)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
