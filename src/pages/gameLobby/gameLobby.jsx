import React, { useState, useEffect } from 'react';
import PlayerList from '@/components/PlayerList/PlayerList';
import { apiService } from '@/services/apiService';
import websocketService from '@/services/websocketService'; // --- IMPORTANTE ---
import { useParams, useNavigate } from 'react-router-dom';
import styles from './gameLobby.module.css';

const GameLobbyPage = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();

  // --- 1. Simplificamos los estados ---
  const [gameDetails, setGameDetails] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 2. Unimos la lógica en un solo useEffect para claridad ---
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }

    // Primero, cargamos los datos iniciales de la sala
    const fetchAndConnect = async () => {
      try {
        const data = await apiService.getGameDetails(gameId);
        setGameDetails(data);
        setPlayers(data.listaJugadores);
        setIsLoading(false);
        console.log("Datos de la sala cargados:", data);

        // Una vez cargados los datos, nos conectamos al WebSocket
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

  if (isLoading) return <div className={styles.loadingSpinner}></div>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.lobbyContainer}>
        <header className={styles.lobbyHeader}>
            <h1 className={styles.gameTitle}>{gameName}</h1>
        </header>

        <main className={styles.mainContent}>
            <PlayerList players={players} />

            {isHost ? (
                <button
                    className={`${styles.startButton} ${
                        players.length < minPlayers || starting
                            ? styles.disabled
                            : styles.enabled
                    }`}
                    onClick={handleStartGame}
                    disabled={players.length < minPlayers || starting}
                >
                    {starting
                        ? "Iniciando..."
                        : `Iniciar partida (${players.length}/${minPlayers})`}
                </button>
            ) : (
                <p>
                    Esperando que el anfitrión inicie la partida... (
                    {players.length}/{minPlayers} jugadores)
                </p>
            )}
        </main>
    </div>
  );
};
export default GameLobbyPage;