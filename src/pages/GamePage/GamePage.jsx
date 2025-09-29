
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
  const [deckCount, setDeckCount] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [turnOrder, setTurnOrder] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [hostId, setHostId] = useState(null);

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }

    const loadGameData = async () => {
      if (gameId && storedPlayerId) {
        try {
          const [handData, turnData, deckData, turnOrderData, gameData] = await Promise.all([
            apiService.getHand(gameId, storedPlayerId),
            apiService.getTurn(gameId),
            apiService.getDeckCount(gameId),
            apiService.getTurnOrder(gameId),
            apiService.getGameDetails(gameId)
          ]);
          setDeckCount(deckData);
          setCurrentTurn(turnData);
          setTurnOrder(turnOrderData);
          setHostId(gameData.id_anfitrion);
          setPlayers(gameData.listaJugadores || []);
          console.log("Turno actual:", turnData);
          console.log("Datos del turno:", turnOrderData);

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

  const isMyTurn = currentTurn === currentPlayerId;

  const handleCardClick = (instanceId) => {
    if (!isMyTurn) {
      console.log("No es tu turno para seleccionar cartas.");
      return;
    }
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

  console.log('--- Estado para Renderizar la Tabla ---');
  console.log(`ID del Jugador Actual (tú):`, { id: currentPlayerId, type: typeof currentPlayerId });
  console.log(`ID del Anfitrión (host):`, { id: hostId, type: typeof hostId });
  console.log(`ID del Turno Actual:`, { id: currentTurn, type: typeof currentTurn });
  console.log(`Orden de Turnos:`, turnOrder);
  console.log(`Lista de Jugadores:`, players);

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
        <button
          onClick={handleDiscard}
          disabled={!isDiscardButtonEnabled}
          className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
        >
          Descartar
        </button>
      </div>
      {turnOrder.length > 0 && players.length > 0 && (
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
              {turnOrder.map((playerId, idx) => {
                const player = players.find(p => p.id_jugador === playerId);
                if (!player) return null;

                const nameClasses = [];
                if (player.id_jugador === hostId) {
                  nameClasses.push(styles.hostName);
                }
                if (player.id_jugador === currentPlayerId) {
                  nameClasses.push(styles.currentUserName);
                }

                return (
                  <tr
                    key={player.id_jugador}
                    className={player.id_jugador === currentTurn ? styles.currentPlayerRow : ''}
                  >
                    <td>{idx + 1}</td>
                    <td className={nameClasses.join(' ')}>
                      {player.nombre_jugador}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    )}
    </div>

  );
};
export default GamePage;