import React, { useState, useEffect } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './GamePage.module.css';
import Deck from '@/components/Deck/Deck.jsx';
import { useNavigate } from 'react-router-dom';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import websocketService from '@/services/websocketService';
const GamePage = () => {
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const deckCount = 25; //cantidad de cartas en el mazo, luego habra que setear el valor real con ws o endpoint 
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);
  const navigate = useNavigate();

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

  const handleDiscard = () => {
    setHand((currentHand) => currentHand.filter((card) => !selectedCards.includes(card)));
    setSelectedCards([]);
  }

  const isDiscardButtonEnabled = selectedCards.length > 0;

  useEffect(() => {
  const handleFinPartida = (message) => {
    // message = { evento: "fin-partida", payload: { ganadores: [...], asesinoGano: true/false } }
    setWinners(message.payload.ganadores);
    setAsesinoGano(message.payload.asesinoGano);
  };
    websocketService.on("fin-partida", handleFinPartida);
    // Simulación: a los 5s mandamos un evento falso, descomentar para verificar pr
    //descomentar para probar la pantalla de victoria
  /*
    const fakeTimeout = setTimeout(() => {
      handleFinPartida({ payload: { ganadores: ["Alice", "Bob"], asesinoGano: true } });
    }, 5000);
    */
    return () => {
      websocketService.off("fin-partida", handleFinPartida);
      // clearTimeout(fakeTimeout);
    };
  }, []);
  
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