/**
 * Layout wrapper for the three conversation screens:
 * questionnaire → details → summary.
 *
 * The wrapper pins the FCA footer and gives each child the paper background.
 */
import type { ReactNode } from 'react';
import { FCAFooter } from '@/components/FCAFooter';
import { ResumeBanner } from '@/components/ResumeBanner';

export default function ConversationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ResumeBanner />
      <main>{children}</main>
      <FCAFooter />
    </>
  );
}
