// ESLint 9 flat config for the master_template lead-magnet app.
//
// Next 16 ships its Next-recommended ruleset as a flat-config array under
// `eslint-config-next/core-web-vitals`, so we spread that in directly.
// We keep import-sort and react-hooks rules on, and relax a couple of rules
// that are known to be noisy in this codebase (copy contains apostrophes,
// and a handful of intentional `any`s in the content layer).

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Ignore build outputs, dependencies, generated content files, and
  // build-time node scripts (which have different constraints).
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'content/generated/**',
      'src/lib/content/catalogue.ts',
      'src/lib/content/generated-order.ts',
      'src/lib/content/index.ts',
      'scripts/**',
      'next-env.d.ts',
    ],
  },

  // Next.js recommended + core-web-vitals + TypeScript-aware rules.
  ...nextCoreWebVitals,

  // Project-wide rule tweaks. Declare the @typescript-eslint plugin here so
  // its rules resolve in flat config.
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Copy in MDX/content often contains apostrophes that are already the
      // correct character. Disabling this avoids a swarm of low-value edits.
      'react/no-unescaped-entities': 'off',

      // Intentional `any` appears in a few content-loading edges; warn is
      // enough signal without blocking CI.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Keep these on — they catch real issues.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default config;
