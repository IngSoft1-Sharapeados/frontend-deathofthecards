// Archivo: /components/GamePage/GamePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Services
import { cardService } from '@/services/cardService';
import websocketService from '@/services/websocketService';
import { apiService } from '@/services/apiService';

// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';

// Styles
import styles from './GamePage.module.css';

const GamePage = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  // Estados de la UI y datos del jugador
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  // Estados globales del juego (turnos, jugadores, etc.)
  const [deckCount, setDeckCount] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [turnOrder, setTurnOrder] = useState([]);
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);

  // Estados para el fin de la partida
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);

  // --- Data Loading and WebSockets ---
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }

    const loadGameData = async () => {
      if (gameId && storedPlayerId) {
        try {
          // Usamos Promise.all para cargar todos los datos iniciales en paralelo
          const [handData, turnData, deckData, turnOrderData, gameData] = await Promise.all([
            apiService.getHand(gameId, storedPlayerId),
            apiService.getTurn(gameId),
            apiService.getDeckCount(gameId),
            apiService.getTurnOrder(gameId),
            apiService.getGameDetails(gameId)
          ]);

          // Actualizamos todo el estado del juego
          setDeckCount(deckData);
          // Si al cargar el estado inicial el mazo ya está en 0, mostramos el fin de partida
          if (deckData === 0) {
            setWinners(["Nadie"]);
            setAsesinoGano(false);
          }
          setCurrentTurn(turnData);
          setTurnOrder(turnOrderData);
          setHostId(gameData.id_anfitrion);
          setPlayers(gameData.listaJugadores || []);
          
          // Añadimos 'instanceId' a cada carta para manejar duplicados en el UI
          const playingHand = cardService.getPlayingHand(handData);
          const handWithInstanceIds = playingHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-${index}`
          }));
          setHand(handWithInstanceIds);

          // Conectamos el WebSocket para actualizaciones en tiempo real
          websocketService.connect(gameId, storedPlayerId);

          // --- Suscripción a eventos de WebSocket ---
          const onDeckUpdate = (message) => setDeckCount(message["cantidad-restante-mazo"]);
          const onTurnUpdate = (message) => setCurrentTurn(message["turno-actual"]);
          const onGameEnd = (message) => {
            setWinners(message.ganadores || []);
            setAsesinoGano(message.asesino_gano || false);
          };

          websocketService.on('actualizacion-mazo', onDeckUpdate);
          websocketService.on('turno-actual', onTurnUpdate);
          websocketService.on('fin-partida', onGameEnd);

        } catch (error) {
          console.error("Error al cargar los datos del juego:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGameData();

    // Función de limpieza para desconectar y desuscribir al desmontar
    return () => {
      // Es importante remover los listeners para evitar memory leaks
      websocketService.off('actualizacion-mazo', () => {});
      websocketService.off('turno-actual', () => {});
      websocketService.off('fin-partida', () => {});
      websocketService.disconnect();
    };
  }, [gameId]);

  // --- Derived State ---
  const isMyTurn = currentTurn === currentPlayerId;
  const isDiscardButtonEnabled = selectedCards.length > 0 && isMyTurn;

  // --- Event Handlers ---
  const handleCardClick = (instanceId) => {
    if (!isMyTurn) {
      console.log("No es tu turno para seleccionar cartas.");
      return;
    }
    setSelectedCards((prev) => 
      prev.includes(instanceId) 
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  const handleDiscard = async () => {
    if (!isDiscardButtonEnabled) return;

    try {
      const cardIdsToDiscard = selectedCards
        .map(instanceId => hand.find(c => c.instanceId === instanceId)?.id)
        .filter(id => id !== undefined);

      // 1. Descartar cartas en el backend
      await apiService.discardCards(gameId, currentPlayerId, cardIdsToDiscard);

      // 2. Actualizar la mano localmente
      const newHand = hand.filter(card => !selectedCards.includes(card.instanceId));
      setHand(newHand);
      setSelectedCards([]);

      // 3. Robar automáticamente hasta tener 6 cartas
      const needed = Math.max(0, 6 - newHand.length);
      if (needed > 0) {
        const drawnCards = await apiService.drawCards(gameId, currentPlayerId, needed);
        const mappedDrawn = cardService.getPlayingHand(drawnCards).map((card, index) => ({
          ...card,
          instanceId: `${card.id}-draw-${Date.now()}-${index}` // Clave única para cartas nuevas
        }));
        setHand(prev => [...prev, ...mappedDrawn]);
      }
      // El backend se encarga de pasar el turno después de esta secuencia.

    } catch (error) {
      console.error("Error al descartar/robar:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

  return (
    <div className={styles.gameContainer}>
      {/* Muestra el modal de fin de partida cuando hay ganadores */}
      {winners && (
        <GameOverScreen 
          winners={winners} 
          asesinoGano={asesinoGano}
          onReturnToMenu={() => navigate("/")} 
        />
      )}

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

      {/* Tabla de jugadores */}
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

                const nameClasses = [
                  player.id_jugador === hostId ? styles.hostName : '',
                  player.id_jugador === currentPlayerId ? styles.currentUserName : ''
                ].join(' ');

                return (
                  <tr
                    key={player.id_jugador}
                    className={player.id_jugador === currentTurn ? styles.currentPlayerRow : ''}
                  >
                    <td>{idx + 1}</td>
                    <td className={nameClasses}>
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