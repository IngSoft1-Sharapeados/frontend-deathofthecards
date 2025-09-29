import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './GamePage.module.css';
import Deck from '@/components/Deck/Deck.jsx';
import { useNavigate } from 'react-router-dom';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { useHand } from '@/hooks/useHand';

const GamePage = () => {
  const { hand, selectedCards, handleCardClick, handleDiscard, isDiscardButtonEnabled } = useHand();
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);
  const navigate = useNavigate();
  const deckCount = 25;

  const handleGameEnd = useCallback((winners, asesinoGano) => {
    setWinners(winners);
    setAsesinoGano(asesinoGano);
  }, []);

  useGameWebSocket(handleGameEnd);
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
          {winners && (<GameOverScreen 
          winners={winners} 
          asesinoGano={asesinoGano}
          onReturnToMenu={() => navigate("/")} 
        />
      )}
    </div>
  );
};
export default GamePage;