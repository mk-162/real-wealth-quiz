/**
 * Server actions for the /conversation/summary page.
 *
 * `renderUserCompassReport` is the bridge that lets the client-side session
 * (which lives in localStorage) drive a server-rendered Compass report. The
 * client sends its `session.answers` map; this action runs the boundary
 * transformer (`buildCompassInputs`) on the server and renders the report
 * with the user's real numbers.
 *
 * Why a server action and not a client component? The Compass report's
 * content loaders (`pdf-content.ts`, `narrative-content.ts`) use Node `fs`
 * and `gray-matter`. They can only run server-side. Returning the rendered
 * Server Component as an RSC payload from this action keeps that constraint
 * intact while still letting client-derived inputs drive the output.
 */
'use server';

import type { ReactNode } from 'react';
import CompassReportSection from './CompassReportSection';
import { buildCompassInputs } from '@/lib/compass';
import type { PartialAnswersMap } from '@/lib/compass/inputs';

export interface RenderUserCompassReportArgs {
  /** The session's `answers` map straight from localStorage. Typed loose
   *  (`Record<string, unknown>`) because the Session shape uses `unknown`
   *  for forward compatibility; `buildCompassInputs` does its own runtime
   *  type checks via `typeof` guards on every read. */
  answers: Record<string, unknown>;
  segmentId: string;
  recipientName: string;
}

export async function renderUserCompassReport({
  answers,
  segmentId,
  recipientName,
}: RenderUserCompassReportArgs): Promise<ReactNode> {
  const inputs = buildCompassInputs(answers as PartialAnswersMap);
  return (
    <CompassReportSection
      segmentId={segmentId}
      recipientName={recipientName}
      inputs={inputs}
    />
  );
}
