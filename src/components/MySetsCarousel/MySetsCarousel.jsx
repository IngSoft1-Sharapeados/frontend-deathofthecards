import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './MySetsCarousel.module.css';
import { cardService } from '@/services/cardService';
import Card from '@/components/Card/Card';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
  </svg>
);

const MySetsCarousel = ({ sets }) => {
  // Map representation ids to card assets
  const allSets = useMemo(() => {
    return (sets || []).map((s) => cardService.getPlayingHand([{ id: s.id }])[0]);
  }, [sets]);

  const [index, setIndex] = useState(0);
  const visible = 3;
  const total = allSets.length;
  const canPrev = index > 0;
  const canNext = index < Math.max(0, total - visible);
  const slice = allSets.slice(index, index + visible);

  const prev = () => canPrev && setIndex((i) => Math.max(0, i - 1));
  const next = () => canNext && setIndex((i) => Math.min(total - visible, i + 1));

  if (!total) return null;

  return (
    <div className={styles.carouselWrapper}>
      <button
        aria-label="Anterior"
        className={`${styles.arrowButton} ${styles.left}`}
        onClick={prev}
        disabled={!canPrev}
      >
        <ArrowIcon />
      </button>

      <div className={styles.scroller}>
        <div className={styles.track}>
          {slice.map((card, idx) => (
            <div key={`${card.id}-${idx}`} className={styles.miniCard}>
              <Card imageName={card.url} subfolder="game-cards" />
            </div>
          ))}
        </div>
      </div>

      <button
        aria-label="Siguiente"
        className={`${styles.arrowButton} ${styles.right}`}
        onClick={next}
        disabled={!canNext}
      >
        <ArrowIcon />
      </button>
    </div>
  );
};

MySetsCarousel.propTypes = {
  // Expect array of objects with `id` of the representation card
  sets: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number.isRequired })).isRequired,
};

export default MySetsCarousel;
