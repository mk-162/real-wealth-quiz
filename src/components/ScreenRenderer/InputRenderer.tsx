/**
 * InputRenderer — takes an `Input` spec from a Screen and renders the right
 * control. This is the single dispatch point for every control type in the
 * questionnaire.
 *
 * Keeps logic here so ScreenRenderer stays focused on layout and engine stays
 * focused on state.
 */
'use client';

import { useEffect } from 'react';
import type { Input, Option } from '../../../content/schema';
import { CardGrid, type CardGridItem } from '@/components/CardGrid';
import { OptionTile } from '@/components/OptionTile';
import { CurrencySlider } from '@/components/CurrencySlider';
import { LikertFive } from '@/components/LikertFive';
import { PairPicker } from '@/components/PairPicker';
import styles from './InputRenderer.module.css';

export interface InputRendererProps {
  input: Input;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function InputRenderer({ input, value, onChange }: InputRendererProps) {
  /* Optional label + helper for every input, shown above the control. */
  const header =
    input.label || input.label_helper ? (
      <div className={styles.inputHead}>
        {input.label ? <label className={styles.label}>{input.label}</label> : null}
        {input.label_helper ? (
          <p className={styles.helper}>{input.label_helper}</p>
        ) : null}
      </div>
    ) : null;

  /* Seed default values for slider/currency controls — the displayed value
     IS the answer from the user's perspective, so Continue should not require
     them to explicitly move the thumb. Fires once per mount when the input
     doesn't yet have an answer and a default is specified. */
  const defaultForControl =
    (input.control === 'slider' || input.control === 'currency') &&
    value === undefined &&
    input.range?.default !== undefined
      ? input.range.default
      : undefined;
  useEffect(() => {
    if (defaultForControl !== undefined) {
      onChange(defaultForControl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.id, defaultForControl]);

  return (
    <div className={styles.inputBlock}>
      {header}
      {renderControl({ input, value, onChange })}
    </div>
  );
}

function renderControl({ input, value, onChange }: InputRendererProps) {
  const options = input.options ?? [];

  switch (input.control) {
    case 'card_select': {
      const items: CardGridItem[] = options.map(toCardItem);
      const selected = typeof value === 'string' && value ? [value] : [];
      return (
        <CardGrid
          items={items}
          selected={selected}
          mode="single"
          onToggle={(v) => onChange(v)}
          columns={options.length > 6 ? 3 : 2}
        />
      );
    }

    case 'multi_select': {
      const items: CardGridItem[] = options.map(toCardItem);
      const current = Array.isArray(value) ? (value as string[]) : [];
      return (
        <CardGrid
          items={items}
          selected={current}
          mode="multi"
          onToggle={(v) => {
            const next = current.includes(v)
              ? current.filter((x) => x !== v)
              : [...current, v];
            onChange(next);
          }}
          columns={options.length > 6 ? 3 : 2}
        />
      );
    }

    case 'radio': {
      const selected = typeof value === 'string' ? value : '';
      return (
        <div className={styles.radioGroup} role="radiogroup" aria-label={input.label}>
          {options.map((opt) => (
            <OptionTile
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={selected === opt.value}
              onSelect={(v) => onChange(v)}
            />
          ))}
        </div>
      );
    }

    case 'slider': {
      const range = input.range ?? { min: 0, max: 100, default: 50, step: 1 };
      const current = typeof value === 'number' ? value : range.default ?? range.min;
      // Detect currency-like sliders (pension pots, salaries, savings, house
      // values). Anything with a max above £1k is treated as money and gets
      // the piecewise snapping scale + £ symbol. Age, percentages, NI years
      // and other small-range sliders keep their literal step from the YAML
      // because the source-of-truth granularity is the right one (1 year,
      // 1% etc.).
      const isCurrencyLike = range.max > 1_000;
      return (
        <CurrencySlider
          label={input.label ?? ''}
          min={range.min}
          max={range.max}
          // Currency sliders use a piecewise scale (auto-picked by max), so
          // the YAML's `step` is ignored — the scale handles granularity.
          // Non-currency sliders keep the literal step + opt out of snapping.
          step={isCurrencyLike ? undefined : range.step ?? 1}
          scale={isCurrencyLike ? undefined : null}
          value={current}
          onChange={(n) => onChange(n)}
          minLabel={
            isCurrencyLike
              ? `£${range.min.toLocaleString('en-GB')}`
              : String(range.min)
          }
          maxLabel={
            isCurrencyLike
              ? `£${range.max.toLocaleString('en-GB')}`
              : String(range.max)
          }
          symbol={isCurrencyLike ? '£' : ''}
          readoutTone="teal"
        />
      );
    }

    case 'currency': {
      const range = input.range ?? { min: 0, max: 1_000_000, default: 0, step: 1_000 };
      const current = typeof value === 'number' ? value : range.default ?? range.min;
      return (
        <CurrencySlider
          label={input.label ?? ''}
          min={range.min}
          max={range.max}
          // Auto-picked piecewise scale (LUMP / MONTHLY) — see CurrencySlider.
          // Pass undefined for `step` so the slider's internal default
          // (a fine £100 nudge) drives the native input.
          step={undefined}
          value={current}
          onChange={(n) => onChange(n)}
          minLabel={`£${range.min.toLocaleString('en-GB')}`}
          maxLabel={`£${range.max.toLocaleString('en-GB')}`}
        />
      );
    }

    case 'likert_5': {
      const current = typeof value === 'number' ? value : undefined;
      return (
        <LikertFive
          value={current}
          onChange={(n) => onChange(n)}
          leftLabel="Not at all confident"
          rightLabel="Very confident"
          ariaLabel={input.label}
        />
      );
    }

    case 'pair_picker': {
      const [left, right] = options;
      if (!left || !right) {
        return <p className={styles.missing}>Pair picker needs two options.</p>;
      }
      return (
        <PairPicker
          leftValue={left.value}
          leftLabel={left.label}
          rightValue={right.value}
          rightLabel={right.label}
          value={typeof value === 'string' ? value : undefined}
          onChange={(v) => onChange(v)}
          ariaLabel={input.label}
        />
      );
    }

    case 'short_text': {
      const current = typeof value === 'string' ? value : '';
      return (
        <textarea
          className={styles.textarea}
          rows={4}
          maxLength={input.max_chars ?? 140}
          value={current}
          placeholder={input.placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-label={input.label}
        />
      );
    }

    case 'number': {
      const current = typeof value === 'number' ? value : '';
      return (
        <input
          type="number"
          className={styles.numberInput}
          value={current}
          min={input.range?.min}
          max={input.range?.max}
          step={input.range?.step ?? 1}
          placeholder={input.placeholder}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isNaN(n) ? undefined : n);
          }}
          aria-label={input.label}
        />
      );
    }

    default: {
      return (
        <p className={styles.missing}>
          Unsupported control type: {String(input.control)}
        </p>
      );
    }
  }
}

function toCardItem(opt: Option): CardGridItem {
  return {
    value: opt.value,
    title: opt.label,
    description: '',
    reveal: opt.reveal,
  };
}
