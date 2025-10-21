// components/CardDraft/CardDraft.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card/Card';
import styles from './CardDraft.module.css';

const CardDraft = ({ cards = [], selectedCards = [], onCardClick, isGlowing }) => {
  return (
    <div className={styles.draftContainer}>
      <div className={styles.cardsWrapper}>
        {cards.map(card => (
          <Card
            key={card.instanceId}
            imageName={card.url}
            subfolder="game-cards"
            isSelected={selectedCards.includes(card.instanceId)}
            onCardClick={() => onCardClick(card.instanceId)}
            isGlowing={isGlowing}
          />
        ))}
      </div>
    </div>
  );
};
export default CardDraft;
