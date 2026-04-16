/**
 * Root layout for the Wealth Conversation app.
 * Imports tokens once and wraps every route.
 *
 * TODO: Add the Typekit kit <link> for gelica + area-normal once we have the
 * kit id from Real Wealth. Until then, serif / sans-serif fallbacks apply and
 * the visual is off-brand.
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
      <head>
        {/* Real Wealth Typekit kit — same source as realwealth.co.uk.
            Hosts gelica (humanist serif) and area-normal (geometric sans). */}
        <link rel="stylesheet" href="https://use.typekit.net/ayo5bxu.css" />
      </head>
      <body>
        {children}
        {/* Temporary — remove before shipping. Lets reviewers jump between templates. */}
        <DevNav />
      </body>
    </html>
  );
}
