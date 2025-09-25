import React, { useState, useEffect } from 'react';
import GameList from '@/components/GameList/GameList.jsx';
import styles from './HomePage.module.css';
import GameCreateFormContainer from '@/containers/CrearPartida/CreateGameContainer';

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    // Simulando la carga de datos
    setTimeout(() => {
      const gamesData = [
        { id: 1, name: 'Partida 1', minPlayers: 2, maxPlayers: 4, currentPlayers: 2 },
        { id: 2, name: 'Partida 2', minPlayers: 3, maxPlayers: 5, currentPlayers: 1 },
        { id: 3, name: 'Partida 3', minPlayers: 2, maxPlayers: 6, currentPlayers: 5 },
        { id: 4, name: 'Partida 4', minPlayers: 4, maxPlayers: 8, currentPlayers: 4 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
        { id: 5, name: 'Partida 5', minPlayers: 2, maxPlayers: 4, currentPlayers: 3 },
      ];
      setGames(gamesData);
      setIsLoading(false);
    }, 1000); 
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Partidas Disponibles</h1>
          <button className={styles.createButton}onClick={() => setShowCreateForm(true)}>
            Crear Partida
          </button>
        </div>
        {isLoading ? <p>Cargando partidas...</p> : <GameList games={games} />}
      </div>
     {/* Renderizar formulario con la prop showForm */}
      <GameCreateFormContainer 
        showForm={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
      
    </div>
  );
};

export default HomePage;