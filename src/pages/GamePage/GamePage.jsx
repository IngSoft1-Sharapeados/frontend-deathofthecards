
import React, { useState, useEffect } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import { useParams } from 'react-router-dom';
import styles from './GamePage.module.css';


const GamePage = () => {
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const { id: gameId } = useParams();

  useEffect(() => {
    const initialHand = cardService.getRandomHand();
    setHand(initialHand);
  }, []);

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }
    const fetchPlayers = async () => {
      try {
        const data = await apiService.getGameDetails(gameId);
        setPlayers(data.listaJugadores || []);
      } catch (err) {
        setPlayers([]);
      }
    };
    if (gameId) fetchPlayers();
  }, [gameId]);

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

      <div className={styles.actionsContainer}>
        <button
          onClick={handleDiscard}
          disabled={!isDiscardButtonEnabled}
          className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
        >
          Descartar
        </button>
      </div>

      {/* Tabla de jugadores */}
      <div className={styles.playersTableContainer}>
        <h2 className={styles.playersTableTitle}>Jugadores ({players.length})</h2>
        <table className={styles.playersTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player.id_jugador}
                className={
                  player.id_jugador === currentPlayerId
                    ? styles.currentPlayerRow
                    : ''
                }
              >
                <td>{idx + 1}</td>
                <td>{player.nombre_jugador}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GamePage;