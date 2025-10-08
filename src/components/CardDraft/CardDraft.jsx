import React, { useState, useEffect } from 'react';
import { cardService } from '@/services/cardService';
import Card from '@/components/Card/Card';
import styles from './CardDraft.module.css';

const CardDraft = () => {
  const [draftCards, setDraftCards] = useState([]);

  useEffect(() => {
    // On component mount, get 3 random game cards for display.
    // This will be replaced with an API call later.
    setDraftCards(cardService.getRandomCards(3));
  }, []);

  return (
    <div className={styles.draftContainer}>
      <div className={styles.cardsWrapper}>
        {draftCards.map(card => (
          <Card
            key={card.id}
            imageName={card.url}
            subfolder="game-cards"
          />
        ))}
      </div>
    </div>
  );
};

export default CardDraft;
