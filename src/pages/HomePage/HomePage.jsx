import React, { useState, useEffect } from 'react';
import GameList from '@/components/GameList/GameList.jsx';
import styles from './HomePage.module.css';
import GameCreateFormContainer from '@/containers/CrearPartida/CreateGameContainer';
import GameListContainer from '@/containers/ListarPartida/GameListContainer';
import UserForm from '@/components/UserForm/UserForm.jsx';

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameToJoinId, setGameToJoinId] = useState(null);

  const handleJoinClick = (gameId) => {
    setGameToJoinId(gameId);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Partidas Disponibles</h1>
            <GameListContainer onJoinClick={handleJoinClick}/>
          <button className={styles.createButton}onClick={() => setShowCreateForm(true)}>
            Crear Partida
          </button>
        </div>
        {isLoading ? <p>Cargando partidas...</p> : <GameList games={games} onJoinClick={handleJoinClick} />}
      </div>
      <GameCreateFormContainer 
        showForm={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
      {gameToJoinId && (
        <UserForm
          gameId={gameToJoinId}
          onClose={() => setGameToJoinId(null)}
        />
      )}
    </div>
  );
};

export default HomePage;