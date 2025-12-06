/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      root: './',  // Explicit root = current dir, silences lockfile warning
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',  // Narrow to API only, avoids global loop with Vercel HTTPS
        headers: [
          { key: 'Permissions-Policy', value: 'microphone=(), camera=()' },
        ],
      },
    ];
  },
  // No rewrites/redirects/i18n = zero loop fuel
};

module.exports = nextConfig;