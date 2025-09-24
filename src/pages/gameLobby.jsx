import React, { useState, useEffect } from 'react';
import PlayerList from '@/components/PlayerList/PlayerList';
import { apiService } from '@/services/apiService';

const GameLobbyPage = () => {
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        //const data = await apiService.getLobbyData(); TO BE DONE
        const data = { gameName: "Partida de Prueba", players: [{ id: 1, name: "Andrés" }, { id: 2, name: "Fran" }] };
        setGameName(data.gameName);
        setPlayers(data.players);
      } catch (error) {
        console.error("Error al cargar la sala:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLobbyData();
  }, []);

  // Efecto para escuchar la llegada de nuevos jugadores para Websocket
//   useEffect(() => {
//     const unsubscribe = apiService.onPlayerJoined((newPlayer) => {
//       setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
//     });

//     return () => {
//       unsubscribe();
//     };
//   }, []);

  if (isLoading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="lobby-container">
      <header className="lobby-header">
        <h1>{gameName}</h1>
      </header>
      <main>
        <PlayerList players={players} />
      </main>
    </div>
  );
};

export default GameLobbyPage;