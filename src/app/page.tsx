/**
 * Homepage - hero with chart-led summary preview (mobile banner, desktop
 * right column), tier picker, freedom moment, ruled-line benefit rows.
 *
 * Every piece of user-facing copy is sourced from content/pages/homepage.md
 * via @/lib/content. To change wording, edit that file and re-run
 * `npm run content:build`.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { TierTile, type TierId } from '@/components/TierTile';
import { FCAFooter } from '@/components/FCAFooter';
import { Logo } from '@/components/Logo';
import { pageValue } from '@/lib/content';
import styles from './page.module.css';

interface TierTileContent {
  id: TierId;
  icon?: string;
  time_label?: string;
  name?: string;
  description?: string;
  ribbon?: string;
  featured?: boolean;
}

interface BenefitCardContent {
  icon?: string;
  headline?: string;
  sub?: string;
}

interface HeroPillContent {
  icon?: string;
  label?: string;
}

const heroChartCards = [
  {
    label: 'Illustrative example',
    title: 'How IHT can bite above GBP 2m',
    note: 'Estate shape, not a personal calculation.',
    values: [34, 47, 55, 62, 74, 82],
    highlight: 4,
  },
  {
    label: 'Illustrative example',
    title: '0.6% in fees over 20 years',
    note: 'Small percentage changes can compound.',
    values: [29, 40, 48, 55, 63, 70],
    highlight: 1,
  },
  {
    label: 'Illustrative example',
    title: 'Extraction mix changes the tax bill',
    note: 'Salary, dividend, and pension in context.',
    values: [25, 35, 42, 50, 58, 66],
    highlight: 2,
  },
] as const;

export default function Home() {
  const router = useRouter();
  const [tier, setTier] = useState<TierId>('standard');

  /* Copy sourced from content/pages/homepage.md. */
  const headline = pageValue<string>('homepage', 'hero.headline', '');
  const sub = pageValue<string>('homepage', 'hero.sub', '');
  const primaryCta = pageValue<string>('homepage', 'hero.primary_cta', 'Start the conversation');
  const reassurance = pageValue<string>('homepage', 'hero.reassurance_line', '');
  const pills = pageValue<HeroPillContent[]>('homepage', 'hero.pills', []);

  const tierHeading = pageValue<string>('homepage', 'tier_picker.heading', '');
  const tierSub = pageValue<string>('homepage', 'tier_picker.sub', '');
  const tierTiles = pageValue<TierTileContent[]>('homepage', 'tier_picker.tiles', []);
  const tierPrimary = pageValue<string>('homepage', 'tier_picker.primary_button', 'Begin →');
  const tierHelper = pageValue<string>('homepage', 'tier_picker.helper', '');

  const freedomText = pageValue<string>('homepage', 'freedom_quote.text', '');

  const benefitCards = pageValue<BenefitCardContent[]>(
    'homepage',
    'benefit_cards',
    [],
  );

  return (
    <>
      <header className={styles.topnav}>
        <Logo tone="teal" width={160} />
        <a
          href="#tier-picker"
          className={styles.topnavCta}
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById('tier-picker')
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Start the conversation
        </a>
      </header>

      <main>
        {/* Hero ---------------------------------------------------- */}
        <section className={styles.hero} aria-label="Introduction">
          <div className={styles.heroBg} />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1 className={styles.headline}>{headline}</h1>
              <p className={styles.sub}>{sub}</p>
              <div className={styles.heroCta}>
                <Button
                  variant="primary"
                  onClick={() =>
                    document
                      .getElementById('tier-picker')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  {primaryCta} →
                </Button>
                <p className={styles.reassure}>{reassurance}</p>
              </div>
              <div className={styles.pills}>
                {pills.map((pill, i) => (
                  <span key={i} className={styles.pill}>
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>

            <HeroChartPreview />
          </div>
        </section>

        {/* Tier picker -------------------------------------------- */}
        <section
          id="tier-picker"
          className={styles.tierSection}
          aria-labelledby="tier-heading"
        >
          <div className={styles.tierInner}>
            <span className={styles.tierKicker}>Choose your depth</span>
            <h2 id="tier-heading" className={styles.tierHeading}>
              {tierHeading}
            </h2>
            <p className={styles.tierSub}>{tierSub}</p>
            <div
              className={`${styles.tiles} ${styles.tileStagger}`}
              role="radiogroup"
              aria-labelledby="tier-heading"
            >
              {tierTiles.map((t) => (
                <TierTile
                  key={t.id}
                  id={t.id}
                  timeLabel={t.time_label ?? ''}
                  name={t.name ?? ''}
                  description={t.description ?? ''}
                  featured={t.featured === true}
                  selected={tier === t.id}
                  onSelect={setTier}
                />
              ))}
            </div>
            <div className={styles.tierCta}>
              <Button
                onClick={() => router.push(`/conversation?tier=${tier}`)}
                aria-label={`Begin the ${tier} conversation`}
              >
                {tierPrimary}
              </Button>
              <p className={styles.helper}>{tierHelper}</p>
            </div>
          </div>
        </section>

        {/* Freedom moment ---------------------------------------- */}
        <section className={styles.freedom} aria-label="Why we ask">
          <blockquote className={styles.freedomQuote}>{freedomText}</blockquote>
        </section>

        {/* Benefit rows ------------------------------------------ */}
        <section className={styles.benefits} aria-label="What you can expect">
          <div className={styles.benefitsInner}>
            {benefitCards.map((card, i) => (
              <article key={i} className={styles.benefitRow}>
                <span className={styles.benefitIcon} aria-hidden="true">
                  <Glyph name={card.icon} />
                </span>
                <div className={styles.benefitBody}>
                  <h3>{card.headline}</h3>
                  <p>{card.sub}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <FCAFooter />
    </>
  );
}

/* Chart-led homepage preview, matching the summary page design language. */
function HeroChartPreview() {
  return (
    <figure
      className={styles.heroMedia}
      aria-label="Illustrative chart examples from the Real Wealth summary page"
    >
      <div className={styles.previewShell}>
        <div className={styles.previewHeader}>
          <span className={styles.previewKicker}>Your considered list</span>
          <p className={styles.previewTitle}>
            From your answers, these are worth a conversation.
          </p>
          <p className={styles.previewCopy}>
            Not a recommendation. A clearer starting point for a planner.
          </p>
        </div>

        <div className={styles.previewCards}>
          {heroChartCards.map((card) => (
            <article key={card.title} className={styles.previewCard}>
              <span className={styles.previewCardLabel}>{card.label}</span>
              <p className={styles.previewCardTitle}>{card.title}</p>
              <p className={styles.previewCardNote}>{card.note}</p>
              <MiniChart values={card.values} highlight={card.highlight} />
            </article>
          ))}
        </div>
      </div>
    </figure>
  );
}

function MiniChart({
  values,
  highlight,
}: {
  values: readonly number[];
  highlight: number;
}) {
  return (
    <div className={styles.miniChart} aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`${styles.miniBar} ${index === highlight ? styles.miniBarHighlight : ''}`}
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  );
}

function Glyph({ name }: { name?: string }) {
  switch (name) {
    case 'heart-handshake':
      return <HeartGlyph />;
    case 'refresh-ccw':
      return <MirrorGlyph />;
    case 'shield-check':
      return <ShieldGlyph />;
    default:
      return <ShieldGlyph />;
  }
}

function HeartGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function MirrorGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M4 12h16M12 4v16"/>
    </svg>
  );
}
function ShieldGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
