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
import { DevNav } from '@/components/DevNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Wealth Conversation — Real Wealth',
  description:
    'A ten-minute conversation with yourself about the life you’re planning for. No advice — a shortlist of things worth talking to a planner about.',
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
        {children}
        {/* Temporary — remove before shipping. Lets reviewers jump between templates. */}
        <DevNav />
      </body>
    </html>
  );
}
