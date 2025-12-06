/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Permissions-Policy', value: 'microphone=(), camera=()' },
        ],
      },
    ];
  },
  // Removed trailingSlash – this kills 80% of Vercel loops in 2025
  // Add back later if needed for SEO
  // trailingSlash: true,
};

module.exports = nextConfig;