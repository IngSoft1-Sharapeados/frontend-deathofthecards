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

  // Función para cambiar el estado y disparar la actualización
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
              className={styles.refreshButton} // Asigna un estilo si lo deseas
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

        {/* Pasamos refreshKey como prop */}
        <GameListContainer 
            onJoinClick={handleJoinClick} 
            key={refreshKey} // Usar key es una forma simple en React de forzar un re-montado y re-fetch
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