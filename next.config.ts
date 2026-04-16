import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Allow the Replit preview proxy to load Next.js dev resources (HMR, fonts).
  // Without this, Next.js 16 blocks cross-origin requests and the page
  // never hydrates — buttons and other interactivity stop working.
  // The wildcard covers all `*.replit.dev` preview domains so the site
  // continues to work after a Replit container restart (the host changes).
  allowedDevOrigins: ['*.replit.dev', '*.picard.replit.dev', '*.repl.co'],
  async rewrites() {
    return [
      // Serve the client-review static bundle (public/client-review/index.html)
      // at the clean /client-review URL. middleware.ts Basic-Auth-gates it.
      {
        source: '/client-review',
        destination: '/client-review/index.html',
      },
    ];
  },
};

export default config;
