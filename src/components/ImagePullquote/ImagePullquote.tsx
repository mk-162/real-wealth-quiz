/**
 * ImagePullquote — a lifestyle photo with a short italic serif caption that
 * floats beneath it in a quiet teal-on-paper card. Pattern lifted from the
 * future_aspirations prototype screen.
 */
import styles from './ImagePullquote.module.css';

export interface ImagePullquoteProps {
  src: string;
  alt: string;
  quote: string;
  attribution?: string;
}

export function ImagePullquote({ src, alt, quote, attribution }: ImagePullquoteProps) {
  return (
    <figure className={styles.figure}>
      <img src={src} alt={alt} loading="lazy" className={styles.img} />
      <figcaption className={styles.caption}>
        <p className={styles.quote}>{quote}</p>
        {attribution ? <p className={styles.attribution}>{attribution}</p> : null}
      </figcaption>
    </figure>
  );
}
