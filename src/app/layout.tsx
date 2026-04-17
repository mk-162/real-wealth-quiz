/**
 * Root layout for the Wealth Conversation app.
 * Imports tokens once and wraps every route.
 *
 * The Typekit kit is loaded via @import in globals.css (not via a <link>
 * here) to keep the <head> free of React-managed children. Some host
 * environments inject scripts into <head> before hydration, which would
 * otherwise cause a hydration mismatch and disable all event handlers.
 */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { HeroMaskDefs } from '@/components/HeroMaskDefs';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Wealth Conversation — Real Wealth',
  description:
    'Your free Wealth Report. Ten minutes of honest questions about your money. In return, a written report showing where your planning is strong, where the gaps are, and what’s worth talking to a planner about.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {/* Shared SVG <clipPath>/<mask> defs for the site's rounded
            hero-image shapes. Lives once at the top of <body> so any
            route can reference the ids from CSS (clip-path: url(#rw-hero-large)). */}
        <HeroMaskDefs />
        {children}
      </body>
    </html>
  );
}
