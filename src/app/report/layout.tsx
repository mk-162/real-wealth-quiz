/**
 * Report route layout.
 *
 * Imports the shared Compass brand theme so every child route
 * (/report/compass-preview, /report/compass-client-view, /report/master)
 * inherits the tokens and shared element styles.
 */

import './_theme/compass-theme.css';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
