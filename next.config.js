/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only mic permissions – no redirects/rewrites to cause loops
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
  // Add this to prevent trailing slash loops (common Next.js culprit)
  trailingSlash: true,
};

module.exports = nextConfig;