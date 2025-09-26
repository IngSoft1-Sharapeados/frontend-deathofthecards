import React, { useState, useEffect } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './GamePage.module.css';

const GamePage = () => {
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(() => {
    const initialHand = cardService.getRandomHand();
    setHand(initialHand);
  }, []);

    useEffect(() => {
    console.log('Cartas seleccionadas:', selectedCards);
  }, [selectedCards]);

  const handleCardClick = (cardName) => {
    setSelectedCards((prevSelected) => {
      if (prevSelected.includes(cardName)) {
        return prevSelected.filter((name) => name !== cardName);
      }
      else {
        return [...prevSelected, cardName];
      }
    });
  };

  return (
    <div className={styles.gameContainer}>
      <h1 className={styles.title}>Tu Mano</h1>
      <div className={styles.handContainer}>
        {hand.map((cardName) => (
          <Card
            key={cardName}
            imageName={cardName}
            isSelected={selectedCards.includes(cardName)}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default GamePage;