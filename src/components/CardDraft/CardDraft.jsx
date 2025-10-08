// components/CardDraft/CardDraft.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card/Card';
import styles from './CardDraft.module.css';

const CardDraft = ({ cards, title }) => {
  if (!cards || cards.length === 0) {
    return <div className={styles.emptyState}>No cards available</div>;
  }

  return (
    <div className={styles.draftContainer}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.cardsWrapper}>
        {cards.map(card => (
          <Card
            key={card.instanceId || card.id}
            imageName={card.url}
            subfolder="game-cards"
            alt={card.nombre || card.type || 'Card'}
          />
        ))}
      </div>
    </div>
  );
};

CardDraft.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string,
};

export default CardDraft;
