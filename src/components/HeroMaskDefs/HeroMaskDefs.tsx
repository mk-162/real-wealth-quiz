/**
 * HeroMaskDefs — shared SVG <clipPath> and <mask> definitions for the
 * rounded-rectangle hero-image shapes used across the app. Matches the
 * shapes used on realwealth.co.uk (plain rounded rectangles at 9px on
 * small cards / 22px on large heroes).
 *
 * Mounted once at the top of <body> in the root layout so every
 * route can reference these IDs via `clip-path: url(#rw-hero-small)` /
 * `url(#rw-hero-large)` from regular CSS — no imports, no React wiring
 * per image.
 *
 * Authored in content/, lifted into this component so the defs travel
 * with the component tree (no static-asset request, no FOUC).
 *
 * Usage in CSS modules:
 *   .img { clip-path: url(#rw-hero-small); }
 *   .heroImg { clip-path: url(#rw-hero-large); }
 *
 * Variants:
 *   - rw-hero-{small,large}       — objectBoundingBox; scales to any size.
 *   - rw-hero-{small,large}-px    — pixel-exact (9px / 22px radii).
 *   - rw-hero-{small,large}-mask  — <mask> equivalents for gradient
 *                                    / inner-shadow experiments.
 */
export function HeroMaskDefs() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={0}
      height={0}
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Small card / secondary image shape: 9/400 ≈ 0.0225 */}
        <clipPath id="rw-hero-small" clipPathUnits="objectBoundingBox">
          <rect x={0} y={0} width={1} height={1} rx={0.0225} ry={0.0225} />
        </clipPath>

        {/* Large hero shape: 22/640 ≈ 0.0344 */}
        <clipPath id="rw-hero-large" clipPathUnits="objectBoundingBox">
          <rect x={0} y={0} width={1} height={1} rx={0.0344} ry={0.0344} />
        </clipPath>

        {/* Pixel-exact variants for when the element dimensions are
            known and you'd rather pin a literal radius. */}
        <clipPath id="rw-hero-small-px">
          <rect x={0} y={0} width="100%" height="100%" rx={9} ry={9} />
        </clipPath>
        <clipPath id="rw-hero-large-px">
          <rect x={0} y={0} width="100%" height="100%" rx={22} ry={22} />
        </clipPath>

        {/* <mask> equivalents — useful for future gradient or inner-shadow
            treatments inside the shape. */}
        <mask
          id="rw-hero-small-mask"
          maskUnits="objectBoundingBox"
          maskContentUnits="objectBoundingBox"
        >
          <rect x={0} y={0} width={1} height={1} rx={0.0225} ry={0.0225} fill="white" />
        </mask>
        <mask
          id="rw-hero-large-mask"
          maskUnits="objectBoundingBox"
          maskContentUnits="objectBoundingBox"
        >
          <rect x={0} y={0} width={1} height={1} rx={0.0344} ry={0.0344} fill="white" />
        </mask>
      </defs>
    </svg>
  );
}
