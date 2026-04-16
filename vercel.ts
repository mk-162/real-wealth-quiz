/**
 * Vercel project configuration for the Wealth Conversation lead-magnet app.
 * Uses @vercel/config (preferred over vercel.json) so the config is TypeScript-checked.
 *
 * If @vercel/config is not yet installed, this file can be a no-op placeholder and
 * the defaults in next.config.ts take over — the build is still a standard Next.js build.
 */
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'next build',
};

export default config;
