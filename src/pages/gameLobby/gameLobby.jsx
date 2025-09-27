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
        console.log("Datos de la sala cargados:", data);

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

    websocketService.on('union-jugador', handlePlayerJoined);
    websocketService.on('iniciar-partida', handleGameStarted);

    return () => {
      websocketService.off('union-jugador', handlePlayerJoined);
      websocketService.off('iniciar-partida', handleGameStarted);
      websocketService.disconnect();
    };
  }, [gameId, navigate]);

  const handleStartGame = async () => {
    if (!currentPlayerId) return;

    try {
      console.log(gameId, currentPlayerId);
      await apiService.startGame(gameId, currentPlayerId);
    } catch (err) {
      alert(`Error al iniciar la partida: ${err.message}`);
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
            {!canStart && (
              <p className={styles.waitingMessage}>
                Faltan {gameDetails.minJugadores - players.length} jugadores para comenzar.
              </p>
            )}
          </div>
        ) : (
          <p className={styles.waitingMessage}>
            Esperando que el anfitrión inicie la partida... ({players.length}/{gameDetails.minJugadores} jugadores)
          </p>
        )}
      </main>
    </div>
  );
};

export default GameLobbyPage;