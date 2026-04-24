/**
 * Report route layout.
 *
 * Imports the shared Compass brand theme so every child route
 * (/report/compass-preview, /report/compass-client-view, /report/master)
 * inherits the tokens and shared element styles.
 *
 * Also mounts <HeroMaskDefs /> once at the top of the tree so any report
 * page can apply the logo-shaped two-leaves clip-path via
 * `clip-path: url(#rw-hero-2-leaves)` in CSS — matching the realwealth.co.uk
 * homepage hero treatment.
 */

import './_theme/compass-theme.css';
import { HeroMaskDefs } from '@/components/HeroMaskDefs/HeroMaskDefs';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeroMaskDefs />
      {children}
    </>
  );
}
