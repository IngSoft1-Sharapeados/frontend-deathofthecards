import React, { useState, useEffect } from 'react';
import PlayerList from '@/components/PlayerList/PlayerList';
import { apiService } from '@/services/apiService';
import { useParams } from 'react-router-dom';
import styles from './gameLobby.module.css'; // <- Importa el módulo

const GameLobbyPage = () => {
  const { id: gameId } = useParams();
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) return;
    const fetchLobbyData = async () => {
      try {
        const data = await apiService.getGameDetails(gameId); // Asumiendo que existe esta función
        setGameName(data.nombre_partida);
        setPlayers(data.listaJugadores);
      } catch (error) {
        console.error("Error al cargar la sala:", error);
        setError("No se pudo cargar la sala.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLobbyData();
  }, [gameId]);

  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className={styles.lobbyContainer}>
      <header className={styles.lobbyHeader}>
        <h1 className={styles.gameTitle}>{gameName}</h1>
      </header>
      <main className={styles.mainContent}>
        <PlayerList players={players} />
      </main>
    </div>
  );
};

export default GameLobbyPage;