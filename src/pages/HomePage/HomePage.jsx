import React, { useState } from 'react'; 
import styles from './HomePage.module.css';
import GameCreateFormContainer from '@/containers/CrearPartida/CreateGameContainer';
import GameListContainer from '@/containers/ListarPartida/GameListContainer';
import UserForm from '@/components/UserForm/UserForm.jsx';

const HomePage = () => {

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameToJoinId, setGameToJoinId] = useState(null);
  
  // Estado para forzar la actualización de la lista de partidas
  const [refreshKey, setRefreshKey] = useState(0);

  const handleJoinClick = (gameId) => {
    setGameToJoinId(gameId);
  };


  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Partidas Disponibles</h1>
          <div className={styles.buttonGroup}> {/* Contenedor para botones */}
            <button 
              className={styles.refreshButton}
              onClick={handleRefresh}
            >
              Actualizar
            </button>
            <button 
              className={styles.createButton} 
              onClick={() => setShowCreateForm(true)}
            >
              Crear Partida
            </button>
          </div>
        </div>

        <GameListContainer 
            onJoinClick={handleJoinClick} 
            key={refreshKey} 
        />

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