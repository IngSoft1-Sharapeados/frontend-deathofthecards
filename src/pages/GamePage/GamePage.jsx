import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './GamePage.module.css';
import websocketService from '@/services/websocketService';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/apiService';
import Deck from '@/components/Deck/Deck.jsx';
import { useNavigate } from 'react-router-dom';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';

const GamePage = () => {
  const { id: gameId } = useParams();
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);
  const navigate = useNavigate();
  const deckCount = 25;

  const handleGameEnd = useCallback((winners, asesinoGano) => {
    setWinners(winners);
    setAsesinoGano(asesinoGano);
  }, []);
  useGameWebSocket(handleGameEnd);

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

  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

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