/**
 * Content schemas — the single contract between the markdown content files,
 * the build-time validator, and the app's typed consumers.
 *
 * Every markdown file under content/ is parsed as YAML frontmatter + body.
 * Frontmatter is validated against one of the schemas below. The body is
 * parsed into labelled sections (# Stem, # Aware body, etc.) — each schema
 * names which body sections it expects.
 *
 * When a content file is malformed, the build fails loudly.
 */
import { z } from 'zod';

/* ---------------------------------------------------------------- */
/* Shared primitives                                                 */
/* ---------------------------------------------------------------- */

export const complianceStatus = z.enum([
  'draft',
  'cfp_signed',
  'compliance_signed',
  'approved_to_ship',
]);
export type ComplianceStatus = z.infer<typeof complianceStatus>;

export const segmentId = z.enum([
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
]);
export type SegmentId = z.infer<typeof segmentId>;

export const tier = z.enum(['A', 'B', 'C']);
export type Tier = z.infer<typeof tier>;

/* ---------------------------------------------------------------- */
/* Provocations                                                      */
/* ---------------------------------------------------------------- */

export const provocationFrontmatter = z.object({
  id: z.string(),
  trigger: z.string(),
  /** Informal description of which segments this targets. `all` allowed. */
  segments: z.array(z.string()).default([]),
  placement: z.string().optional(),
  compliance_status: complianceStatus.default('draft'),
  cfp_signoff_date: z.string().nullable().default(null),
  compliance_signoff_date: z.string().nullable().default(null),
  version: z.string().default('0.1.0'),
  source_refs: z.array(z.string()).default([]),
});

export const provocationSchema = provocationFrontmatter.extend({
  /** From the body — set by the loader. */
  headline: z.string(),
  body: z.string(),
  close: z.string(),
});
export type Provocation = z.infer<typeof provocationSchema>;

/* ---------------------------------------------------------------- */
/* Awareness checks                                                  */
/* ---------------------------------------------------------------- */

export const awarenessFrontmatter = z.object({
  id: z.string(),
  core: z.boolean().default(false),
  trigger: z.string(),
  placement: z.string(),
  source: z.string(),
  rank: z.number().int().nullable().default(null),
  tier_limit: z.array(tier).default(['A', 'B', 'C']),
  compliance_status: complianceStatus.default('draft'),
});

export const awarenessSchema = awarenessFrontmatter.extend({
  stem: z.string(),
  aware_body: z.string(),
  partial_body: z.string(),
  unaware_body: z.string(),
});
export type AwarenessCheck = z.infer<typeof awarenessSchema>;

/* ---------------------------------------------------------------- */
/* Segment CTAs (summary page)                                       */
/* ---------------------------------------------------------------- */

export const segmentCtaFrontmatter = z.object({
  id: z.string(),
  /** Segment id (S1–S9), or an overlay tag. */
  kind: z.enum(['segment', 'overlay']),
  segment: segmentId.nullable().default(null),
  overlay: z.enum(['advised_but_looking', 'urgency_this_week']).nullable().default(null),
  button_link: z.string(),
});

export const segmentCtaSchema = segmentCtaFrontmatter.extend({
  headline: z.string(),
  body: z.string(),
  button: z.string(),
  helper: z.string(),
});
export type SegmentCta = z.infer<typeof segmentCtaSchema>;

/* ---------------------------------------------------------------- */
/* Screens (questionnaire)                                           */
/* ---------------------------------------------------------------- */

export const inputType = z.enum([
  'radio',
  'card_select',
  'multi_select',
  'slider',
  'currency',
  'short_text',
  'likert_5',
  'pair_picker',
  'number',
]);
export type InputType = z.infer<typeof inputType>;

export const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  /** Small inline hint shown on the card after selection. */
  reveal: z.string().optional(),
  /** Name of a sibling input on the same screen to reveal when this option
      is chosen. Rendered by the visibility helper in src/lib/questionnaire. */
  conditional_reveal: z.string().optional(),
});
export type Option = z.infer<typeof optionSchema>;

export const inputSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  label_helper: z.string().optional(),
  control: inputType,
  options: z.array(optionSchema).optional(),
  /** For sliders / numeric. */
  range: z
    .object({
      min: z.number(),
      max: z.number(),
      default: z.number().optional(),
      step: z.number().default(1),
    })
    .optional(),
  placeholder: z.string().optional(),
  max_chars: z.number().optional(),
  required: z.boolean().default(false),
  conditional_reveal: z.string().optional(),
});
export type Input = z.infer<typeof inputSchema>;

export const screenFrontmatter = z.object({
  id: z.string(),
  screen_number: z.string(),
  title: z.string(),
  section: z.string(),
  layout: z.enum(['asymmetric', 'centred', 'transition', 'intro']),
  grouped: z.boolean().default(false),
  gate_critical: z.boolean().default(false),
  segments_served: z.array(z.string()).default(['all']),
  skip: z.array(z.string()).default([]),
  tier_limit: z.array(tier).default(['A', 'B', 'C']),
  image_family: z.string().optional(),
  image_direction: z.string().optional(),
  q_refs: z.array(z.string()).default([]),
  logged_as: z.array(z.string()).default([]),
  conditional_logic: z.string().optional(),
  inputs: z.array(inputSchema).default([]),
  transition_icon: z.string().optional(),
});

export const screenSchema = screenFrontmatter.extend({
  /** The serif card headline shown on the right panel. */
  headline: z.string().optional(),
  /** Supporting body below the headline. */
  sub: z.string().optional(),
  /**
   * Optional per-screen pullquote shown in the left column.
   * Overrides the section-level pullquote from sections.ts when present.
   * Empty string suppresses the section default — nothing is shown.
   * Omit the section entirely to inherit the section default.
   */
  pullquote: z.string().optional(),
  /** Free-form body for transition / intro screens. */
  body: z.string().optional(),
});
export type Screen = z.infer<typeof screenSchema>;

/* ---------------------------------------------------------------- */
/* Pages (homepage, data-capture, summary structure)                 */
/* ---------------------------------------------------------------- */

export const pageSchema = z.object({
  id: z.string(),
  title: z.string(),
  sections: z.record(z.string(), z.unknown()),
});
export type Page = z.infer<typeof pageSchema>;

/* ---------------------------------------------------------------- */
/* Microcopy                                                         */
/* ---------------------------------------------------------------- */

export const microcopyGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  entries: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      note: z.string().optional(),
    }),
  ),
});
export type MicrocopyGroup = z.infer<typeof microcopyGroupSchema>;

/* ---------------------------------------------------------------- */
/* Report blocks (canonical PDF-report shape)                        */
/* ---------------------------------------------------------------- */

/**
 * Every file under `content/report/` follows the same shape after the
 * Phase 2 (S4) simplification:
 *
 *   ---
 *   id: report.<slug>
 *   kind: per_segment | global
 *   title: <short label>
 *   description: <optional one-line note>
 *   compliance_status: draft | cfp_signed | compliance_signed | approved_to_ship
 *   # any kind-specific structured config (e.g. tile thresholds) goes here
 *   ---
 *
 *   # S1 ... # S9   (per_segment)
 *   # Body          (global)
 *
 * The frontmatter validates as a closed shape (universal fields + a loose
 * `extras` bucket for kind-specific config — tile thresholds, gauge zone
 * descriptors, awareness expanded source_id, etc.). Per-shape semantics live
 * in the renderer (`src/lib/compass/pdf-content.ts`), not the schema.
 */

export const reportBlockKind = z.enum(['per_segment', 'global']);
export type ReportBlockKind = z.infer<typeof reportBlockKind>;

/**
 * Universal frontmatter every report block carries. Per-shape extras come
 * through verbatim — Zod's `.passthrough()` lets unknown keys ride along
 * untouched, preserving round-trip fidelity for tile thresholds, gauge zone
 * descriptors, awareness `source_id`, and so on.
 */
export const reportBlockFrontmatter = z
  .object({
    id: z.string(),
    kind: reportBlockKind,
    title: z.string(),
    description: z.string().optional(),
    compliance_status: complianceStatus.default('draft'),
  })
  .passthrough();
export type ReportBlockFrontmatter = z.infer<typeof reportBlockFrontmatter>;

/**
 * A parsed report block — frontmatter + raw body. Per-segment blocks split
 * into a `# S1`..`# S9` map; global blocks expose a single `# Body` (or
 * inherit the raw body when no `# Body` heading is used). The split happens
 * at the loader level, not the schema level — see `pdf-content.ts`.
 */
export const reportBlockSchema = reportBlockFrontmatter.extend({
  /** Raw markdown body after the frontmatter fence. */
  body: z.string(),
});
export type ReportBlock = z.infer<typeof reportBlockSchema>;

/* ---------------------------------------------------------------- */
/* Catalogues (what content:build emits)                             */
/* ---------------------------------------------------------------- */

export interface ContentCatalogue {
  screens: Screen[];
  awareness: AwarenessCheck[];
  provocations: Provocation[];
  segments: SegmentCta[];
  pages: Page[];
  microcopy: MicrocopyGroup[];
}
