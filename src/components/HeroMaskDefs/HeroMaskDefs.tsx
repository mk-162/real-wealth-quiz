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

        {/* Two-leaves hero cutout — lifts the actual petal geometry
            from real-wealth-logo-mark.svg (two opposite sharp corners +
            two curved edges) and stacks two mirrored copies vertically
            to echo the symbol. Top petal has its sharp corners at the
            top-left and bottom-right; bottom petal is a horizontal
            mirror (sharp corners at top-right and bottom-left), so the
            two lean in opposite directions the way the live site does.
            A thin horizontal band of the host surface shows between.

            Source petal (logo mark, local coords, 26.962 × 17.875):
              M 0 -17.875 L -9.087 -17.875
              C -9.087 -8.003 -1.085 0 8.787 0
              L 17.875 0
              C 17.875 -9.872 9.872 -17.875 0 -17.875
            Normalized to a 1 × 0.48 box (top leaf) by shifting
            (+9.087, +17.875) and scaling (/26.962, ×0.48/17.875). The
            bottom leaf applies (x → 1-x) then shifts y by +0.52. */}
        <clipPath id="rw-hero-2-leaves" clipPathUnits="objectBoundingBox">
          <path d="M 0.337 0 L 0 0 C 0 0.265 0.297 0.48 0.663 0.48 L 1 0.48 C 1 0.215 0.703 0 0.337 0 Z" />
          <path d="M 0.663 0.52 L 1 0.52 C 1 0.785 0.703 1 0.337 1 L 0 1 C 0 0.735 0.297 0.52 0.663 0.52 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
