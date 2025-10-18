import React, { useEffect } from 'react';
import Card from '@/components/Card/Card';
import styles from './EventDisplay.module.css';

const EventDisplay = ({ card, onDisplayComplete }) => {
  useEffect(() => {
    if (card) {
      const timer = setTimeout(() => {
        onDisplayComplete();
      }, 3000); // La carta se mostrará por 3 segundos

      return () => clearTimeout(timer);
    }
  }, [card, onDisplayComplete]);

  if (!card) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.displayContainer}>
        {card.message && <p className={styles.eventMessage}>{card.message}</p>}
        <div className={styles.cardContainer}>
          <Card imageName={card.imageName} subfolder="game-cards" />
        </div>
      </div>
    </div>
  );
};

export default EventDisplay;