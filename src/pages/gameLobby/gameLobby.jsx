import React, { useState, useEffect } from 'react';
import PlayerList from '@/components/PlayerList/PlayerList';
import { apiService } from '@/services/apiService';
import websocketService from '@/services/websocketService'; 
import { useParams, useNavigate } from 'react-router-dom';
import styles from './gameLobby.module.css';

const GameLobbyPage = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();

  const [gameDetails, setGameDetails] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelledModalOpen, setIsCancelledModalOpen] = useState(false);

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }

    const fetchAndConnect = async () => {
      try {
        const data = await apiService.getGameDetails(gameId);
        setGameDetails(data);
        setPlayers(data.listaJugadores);
        setIsLoading(false);

        if (storedPlayerId) {
          websocketService.connect(gameId, storedPlayerId);
        }

      } catch (err) {
        console.error("Error al cargar la sala:", err);
        setError("No se pudo cargar la sala.");
        setIsLoading(false);
      }
    };

    fetchAndConnect();

    const handlePlayerJoined = (data) => {
      const newPlayer = { id_jugador: data.id_jugador, nombre_jugador: data.nombre_jugador };
      setPlayers(prevPlayers => {
        if (prevPlayers.find(p => p.id_jugador === newPlayer.id_jugador)) {
          return prevPlayers;
        }
        return [...prevPlayers, newPlayer];
      });
    };

    const handleGameStarted = () => {
      navigate(`/partidas/${gameId}/juego`);
    };

    const handleGameCancelled = () => {
      // Host abandoned; show modal and on confirm navigate home
      setIsCancelledModalOpen(true);
    };

    const handlePlayerLeft = (message) => {
      const leftId = message['id-jugador'];
      setPlayers(prev => prev.filter(p => p.id_jugador !== leftId));
    };

    websocketService.on('union-jugador', handlePlayerJoined);
    websocketService.on('iniciar-partida', handleGameStarted);
    websocketService.on('partida-cancelada', handleGameCancelled);
    websocketService.on('abandono-jugador', handlePlayerLeft);

    return () => {
      websocketService.off('union-jugador', handlePlayerJoined);
      websocketService.off('iniciar-partida', handleGameStarted);
      websocketService.off('partida-cancelada', handleGameCancelled);
      websocketService.off('abandono-jugador', handlePlayerLeft);
      websocketService.disconnect();
    };
  }, [gameId, navigate]);

  const handleStartGame = async () => {
    if (!currentPlayerId) return;

    try {
      await apiService.startGame(gameId, currentPlayerId);
    } catch (err) {
      alert(`Error al iniciar la partida: ${err.message}`);
    }
  };

  const handleAbandonGame = async () => {
    if (!currentPlayerId) return;
    const confirmMsg = isHost
      ? 'Sos el anfitrión: abandonar eliminará la partida para todos. ¿Deseás continuar?'
      : '¿Seguro que querés abandonar la sala?';
    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    try {
      await apiService.abandonGame(gameId, currentPlayerId);
      // Si es host, el backend emitirá 'partida-cancelada' y mostraremos modal.
      // En cualquier caso, llevamos al usuario al Home.
      navigate('/');
    } catch (err) {
      alert(`No se pudo abandonar la partida: ${err.message}`);
    }
  };

  if (isLoading || !gameDetails) {
    return <div className={styles.loadingSpinner}></div>;
  }
  if (error) {
    return <p>{error}</p>;
  }

  const isHost = currentPlayerId == gameDetails.id_anfitrion;
  const canStart = players.length >= gameDetails.minJugadores;

  return (
    <div className={styles.lobbyContainer}>
      <header className={styles.lobbyHeader}>
        <h1 className={styles.gameTitle}>{gameDetails.nombre_partida}</h1>
      </header>

      <main className={styles.mainContent}>
        <PlayerList players={players} />
        {isHost ? (
          <div className={styles.hostActions}>
            <button
              className={styles.startButton}
              onClick={handleStartGame}
              disabled={!canStart}
            >
              Iniciar Partida ({players.length}/{gameDetails.minJugadores})
            </button>
            <button
              className={`${styles.startButton} ${styles.dangerButton}`}
              onClick={handleAbandonGame}
            >
              Cancelar partida
            </button>
            {!canStart && (
              <p className={styles.waitingMessage}>
                Faltan {gameDetails.minJugadores - players.length} jugadores para comenzar.
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className={styles.waitingMessage}>
              Esperando que el anfitrión inicie la partida... ({players.length}/{gameDetails.minJugadores} jugadores)
            </p>
            <button
              className={`${styles.startButton} ${styles.dangerButton}`}
              onClick={handleAbandonGame}
            >
              Abandonar sala
            </button>
          </div>
        )}
      </main>

      {isCancelledModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>La partida fue cancelada</h2>
            <p>El anfitrión abandonó la sala. Serás redirigido al inicio.</p>
            <button className={styles.returnButton} onClick={() => navigate('/')}>Volver al inicio</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLobbyPage;