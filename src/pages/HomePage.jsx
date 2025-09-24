import React, { useState, useEffect } from 'react';
import GameList from '@/components/GameList/GameList.jsx';

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        //const gamesData = await apiService.getGames(); TO BE DONE
        const gamesData = [{
          id: 'g1',
          name: 'Partida Test',
          minPlayers: 2,
          maxPlayers: 5,
          currentPlayers: 4,
        },{
          id: 'g1',
          name: 'Partida Test',
          minPlayers: 2,
          maxPlayers: 5,
          currentPlayers: 4,
        }];
        setGames(gamesData);
      } catch (error) {
        console.error("Error al obtener las partidas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Partidas Disponibles</h1>
      {isLoading ? <p>Cargando partidas...</p> : <GameList games={games} />}
    </div>
  );
};

export default HomePage;