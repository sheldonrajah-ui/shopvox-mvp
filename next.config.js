/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mic policy only – no i18n, no rewrites, no trailingSlash
  async headers() {
    return [
      {
        // Narrow source to avoid loop with Vercel HTTPS
        source: '/api/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'microphone=(), camera=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;