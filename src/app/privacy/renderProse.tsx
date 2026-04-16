/**
 * Minimal markdown-to-React renderer for the legal/policy pages.
 *
 * Why hand-rolled: the project does not depend on react-markdown and we are
 * not adding new packages. The legal pages only need:
 *   - `## ` H2 subheadings
 *   - paragraphs (split on blank lines)
 *   - `- ` bullet lists
 *   - HTML comments (stripped — used by Compliance to mark draft notes)
 *
 * Anything fancier (tables, links, inline emphasis) is intentionally not
 * supported here. If/when we need it, swap this helper for a real markdown
 * runtime. The pages will still render readably under the simple parser.
 */
import { Fragment, type ReactNode } from 'react';

/** Strip HTML comments, including multi-line ones. */
function stripComments(input: string): string {
  return input.replace(/<!--[\s\S]*?-->/g, '').trim();
}

/** Split body into top-level blocks: subheadings, paragraphs, lists. */
type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] };

function parseBlocks(body: string): Block[] {
  const cleaned = stripComments(body);
  const lines = cleaned.split(/\r?\n/);
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ kind: 'p', text: para.join(' ').trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.length > 0) {
      blocks.push({ kind: 'ul', items: list });
    }
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushPara();
      flushList();
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushPara();
      flushList();
      blocks.push({ kind: 'h2', text: h2[1].trim() });
      continue;
    }

    const li = line.match(/^[-*]\s+(.+)$/);
    if (li) {
      flushPara();
      if (!list) list = [];
      list.push(li[1].trim());
      continue;
    }

    flushList();
    para.push(line);
  }

  flushPara();
  flushList();
  return blocks;
}

/**
 * Render a body string as a sequence of headings, paragraphs and lists.
 * The component is a pure function — no client interactivity.
 */
export function renderProse(body: string): ReactNode {
  const blocks = parseBlocks(body);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'h2') {
          return <h2 key={i}>{block.text}</h2>;
        }
        if (block.kind === 'ul') {
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            <Fragment>{block.text}</Fragment>
          </p>
        );
      })}
    </>
  );
}
