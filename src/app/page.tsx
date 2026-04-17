/**
 * Homepage - hero with square summary preview (mobile banner, desktop
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

export default function Home() {
  const router = useRouter();
  const [tier, setTier] = useState<TierId>('standard');

  /* Copy sourced from content/pages/homepage.md. */
  const headline = pageValue<string>('homepage', 'hero.headline', '');
  const sub = pageValue<string>('homepage', 'hero.sub', '');
  const primaryCta = pageValue<string>('homepage', 'hero.primary_cta', 'Free report.');
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
        {/* Width is owned by the parent header's `--logo-width` custom
            property so we get the live-site's responsive ladder
            (200 / 188 / 152 across desktop / tablet / mobile). */}
        <Logo tone="ink" />
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
          Free report.
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
                {/* Solid-orange "Get in Touch" style CTA on the teal
                    hero — exactly as realwealth.co.uk treats its
                    primary conversion button. The orange fill + white
                    ring + italic gelica reads as the signature
                    Real Wealth action across every surface. */}
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

            <figure className={styles.heroMedia}>
              <img
                src="/homepage-summary-preview.png"
                alt="Real Wealth summary page showing conversation prompts and chart examples"
                className={styles.heroPreviewImage}
                loading="eager"
              />
            </figure>
          </div>
        </section>

        {/* Tier picker -------------------------------------------- */}
        <section
          id="tier-picker"
          className={styles.tierSection}
          aria-labelledby="tier-heading"
        >
          <div className={styles.tierInner}>
            <span className={styles.tierKicker}>Choose your pace</span>
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
