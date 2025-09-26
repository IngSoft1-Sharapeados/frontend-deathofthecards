import React, { useState, useEffect } from 'react';
import GameList from '@/components/GameList/GameList.jsx';
import styles from './HomePage.module.css';
import GameCreateFormContainer from '@/containers/CrearPartida/CreateGameContainer';
import GameListContainer from '@/containers/ListarPartida/GameListContainer';
const HomePage = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Partidas Disponibles</h1>
            <GameListContainer />
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