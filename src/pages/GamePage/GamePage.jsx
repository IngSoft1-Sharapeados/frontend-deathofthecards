import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Services
import { cardService } from '@/services/cardService';
import websocketService from '@/services/websocketService';
import { apiService } from '@/services/apiService';

// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';

// Styles
import styles from './GamePage.module.css';

const GamePage = () => {
  const { id: gameId } = useParams();

  // State
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deckCount, setDeckCount] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null); // ID del jugador cuyo turno es
  const [turnOrder, setTurnOrder] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null); // ID del jugador que está viendo la página
  const [hostId, setHostId] = useState(null);

  // Efecto para cargar todos los datos del juego al montar el componente
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }

    const loadGameData = async () => {
      if (gameId && storedPlayerId) {
        try {
          // Usamos Promise.all para realizar todas las peticiones en paralelo
          const [handData, turnData, deckData, turnOrderData, gameData] = await Promise.all([
            apiService.getHand(gameId, storedPlayerId),
            apiService.getTurn(gameId),
            apiService.getDeckCount(gameId),
            apiService.getTurnOrder(gameId),
            apiService.getGameDetails(gameId)
          ]);

          // Actualizamos el estado con los datos recibidos
          setDeckCount(deckData);
          setCurrentTurn(turnData);
          setTurnOrder(turnOrderData);
          setHostId(gameData.id_anfitrion);
          setPlayers(gameData.listaJugadores || []);

          // Procesamos la mano para añadir un 'instanceId' único a cada carta
          // Esto es crucial para manejar correctamente cartas duplicadas en el UI
          let playingHand = cardService.getPlayingHand(handData);
          const handWithInstanceIds = playingHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-${index}` // Ej: "16-0", "7-1", "16-2"
          }));
          setHand(handWithInstanceIds);

          // Conectamos el WebSocket para actualizaciones en tiempo real
          websocketService.connect(gameId, storedPlayerId);

        } catch (error) {
          console.error("Error al cargar los datos del juego:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGameData();

    // Función de limpieza para desconectar el WebSocket al desmontar el componente
    return () => {
      websocketService.disconnect();
    };
  }, [gameId]);

  // Derivamos del estado si es el turno del jugador actual
  const isMyTurn = currentTurn === currentPlayerId;

  // Manejador para la selección/deselección de cartas
  const handleCardClick = (instanceId) => {
    if (!isMyTurn) {
      console.log("No es tu turno para seleccionar cartas.");
      return; // No permite seleccionar si no es su turno
    }
    setSelectedCards((prevSelected) => {
      if (prevSelected.includes(instanceId)) {
        return prevSelected.filter((id) => id !== instanceId);
      } else {
        return [...prevSelected, instanceId];
      }
    });
  };

  // Manejador para el descarte de cartas
  const handleDiscard = async () => {
    if (selectedCards.length === 0 || !isMyTurn) {
      return; // No hace nada si no hay cartas seleccionadas o no es su turno
    }

    try {
      const storedPlayerId = sessionStorage.getItem('playerId');

      // Traduce los 'instanceId' del frontend a los 'id' de carta que el backend necesita
      const cardIdsToDiscard = selectedCards.map(instanceId => {
        const card = hand.find(c => c.instanceId === instanceId);
        return card ? card.id : null;
      }).filter(id => id !== null);

      await apiService.discardCards(gameId, storedPlayerId, cardIdsToDiscard);

      // Actualiza el estado local de la mano para una respuesta visual inmediata
      setHand(currentHand =>
        currentHand.filter(card => !selectedCards.includes(card.instanceId))
      );
      setSelectedCards([]); // Limpia la selección

      console.log("Cartas descartadas con éxito.");

    } catch (error) {
      console.error("Error al descartar:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // El botón de descarte se habilita solo si hay cartas seleccionadas Y es el turno del jugador
  const isDiscardButtonEnabled = selectedCards.length > 0 && isMyTurn;

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
        <button
          onClick={handleDiscard}
          disabled={!isDiscardButtonEnabled}
          className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
        >
          Descartar
        </button>
      </div>

      {/* Renderiza la tabla de jugadores si los datos están disponibles */}
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
                if (!player) return null; // Si por alguna razón el jugador no se encuentra

                // Construye las clases CSS dinámicamente
                const nameClasses = [];
                if (player.id_jugador === hostId) nameClasses.push(styles.hostName);
                if (player.id_jugador === currentPlayerId) nameClasses.push(styles.currentUserName);

                return (
                  <tr
                    key={player.id_jugador}
                    // Resalta la fila del jugador cuyo turno es
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