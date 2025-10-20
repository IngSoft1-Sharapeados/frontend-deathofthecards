import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './MySecretsCarousel.module.css';
import MySecretCard from '@/components/MySecretCard/MySecretCard';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" />
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
              <div className={styles.cardWrapper}>
                {card.isRevealed && (
                  <div className={styles.eyeOverlay} aria-label="Revelado">
                    <span className={styles.eyeIcon}><EyeIcon /></span>
                  </div>
                )}
                <MySecretCard secret={card} />
              </div>
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
