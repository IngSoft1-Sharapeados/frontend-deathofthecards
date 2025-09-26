import React from 'react';
import PropTypes from 'prop-types';
import styles from '@/components/PlayerList/PlayerList.module.css';

const PlayerList = ({ players }) => {
  return (
    <div className={styles.playerListContainer}>
      <h2 className={styles.title}>Jugadores en la sala</h2>
      {players.length > 0 ? (
        <ul className={styles.list}>
          {players.map((player) => (
            <li key={player.id_jugador} className={styles.playerItem}>
              {player.nombre_jugador}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.waitingText}>Esperando jugadores...</p>
      )}
    </div>
  );
};

PlayerList.propTypes = {
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default PlayerList;