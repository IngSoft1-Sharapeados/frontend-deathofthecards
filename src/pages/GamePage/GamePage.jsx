import React, { useState, useEffect } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './GamePage.module.css';
import websocketService from '@/services/websocketService';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/apiService';
import Deck from '@/components/Deck/Deck.jsx';

const GamePage = () => {
  const { id: gameId } = useParams();
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const deckCount = 25; //cantidad de cartas en el mazo, luego habra que setear el valor real con ws o endpoint 

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');

    const loadGameData = async () => {
      if (gameId && storedPlayerId) {
        try {
          const handData = await apiService.getHand(gameId, storedPlayerId);

          let playingHand = cardService.getPlayingHand(handData);


          const handWithInstanceIds = playingHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-${index}` // Ej: "16-0", "7-1", "16-2"
          }));
          setHand(handWithInstanceIds);

          websocketService.connect(gameId, storedPlayerId);

        } catch (error) {
          console.error("Error al cargar la mano:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadGameData();
    return () => {
      websocketService.disconnect();
    };
  }, [gameId]);


  useEffect(() => {
    console.log('Cartas seleccionadas:', selectedCards);
  }, [selectedCards]);

  const handleCardClick = (instanceId) => {
    setSelectedCards((prevSelected) => {
      if (prevSelected.includes(instanceId)) {
        return prevSelected.filter((id) => id !== instanceId);
      } else {
        return [...prevSelected, instanceId];
      }
    });
  };

  const handleDiscard = () => {
    setHand((currentHand) =>
      currentHand.filter((card) => !selectedCards.includes(card.instanceId))
    );
    setSelectedCards([]);
  };
  const isDiscardButtonEnabled = selectedCards.length > 0;

  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }


  const isDiscardButtonEnabled = selectedCards.length > 0;
  return (
    <div className={styles.gameContainer}>
      <Deck count={deckCount} /> 
      <h1 className={styles.title}>Tu Mano</h1>
      <div className={styles.handContainer}>
        {hand.map((card) => (
          <Card
            key={card.instanceId} 
            imageName={card.url}
            isSelected={selectedCards.includes(card.instanceId)}
            onCardClick={() => handleCardClick(card.instanceId)}
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