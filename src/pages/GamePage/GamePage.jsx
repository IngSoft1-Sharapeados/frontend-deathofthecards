import React, { useState, useEffect } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './GamePage.module.css';
import Deck from '@/components/Deck/Deck.jsx';

const GamePage = () => {
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const deckCount = 25; //cantidad de cartas en el mazo, luego habra que setear el valor real con ws o endpoint 

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

  const handleDiscard = async () => {
    if (selectedCards.length === 0) {
      return;
    }

    try {
      const storedPlayerId = sessionStorage.getItem('playerId');

      // 2. Traduce los 'instanceId' del frontend a los 'id' de carta que el backend necesita.
      const cardIdsToDiscard = selectedCards.map(instanceId => {
        const card = hand.find(c => c.instanceId === instanceId);
        return card ? card.id : null;
      }).filter(id => id !== null); 

      await apiService.discardCards(gameId, storedPlayerId, cardIdsToDiscard);

      setHand(currentHand =>
        currentHand.filter(card => !selectedCards.includes(card.instanceId))
      );
      setSelectedCards([]); 

      console.log("Cartas descartadas con éxito.");

    } catch (error) {
      console.error("Error al descartar:", error);
      alert(`Error: ${error.message}`); 
    }
  };

  const isDiscardButtonEnabled = selectedCards.length > 0;
  return (
    <div className={styles.gameContainer}>
      <Deck count={deckCount} />
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

      <div className={styles.actionsContainer}>
        {/* <button
          disabled={true}
          className={styles.playButton}
        >
          Jugar cartas
        </button> */}
        <button
          onClick={handleDiscard}
          disabled={!isDiscardButtonEnabled}
          className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
        >
          Descartar
        </button>
      </div>
    </div>
  );
};
export default GamePage;