import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './MySecretsCarousel.module.css';
import Card from '@/components/Card/Card';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
  </svg>
);

const MySecretsCarousel = ({ secretCards }) => {
  const [index, setIndex] = useState(0);
  const visible = 3;
  const total = secretCards.length;
  const canPrev = index > 0;
  const canNext = index < Math.max(0, total - visible);
  const slice = secretCards.slice(index, index + visible);

  const prev = () => canPrev && setIndex((i) => Math.max(0, i - 1));
  const next = () => canNext && setIndex((i) => Math.min(total - visible, i + 1));

  if (!total) return null;

  return (
    <div className={styles.carouselWrapper}>
      {total > visible && (
        <button
          aria-label="Anterior"
          className={`${styles.arrowButton} ${styles.left}`}
          onClick={prev}
          disabled={!canPrev}
        >
          <ArrowIcon />
        </button>
      )}

      <div className={styles.scroller}>
        <div className={styles.track}>
          {slice.map((card) => (
            <div key={card.instanceId} className={styles.miniCard}>
              <Card imageName={card.url} subfolder="secret-cards" />
            </div>
          ))}
        </div>
      </div>

      {total > visible && (
        <button
          aria-label="Siguiente"
          className={`${styles.arrowButton} ${styles.right}`}
          onClick={next}
          disabled={!canNext}
        >
          <ArrowIcon />
        </button>
      )}
    </div>
  );
};

MySecretsCarousel.propTypes = {
  secretCards: PropTypes.arrayOf(
    PropTypes.shape({
      instanceId: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default MySecretsCarousel;
