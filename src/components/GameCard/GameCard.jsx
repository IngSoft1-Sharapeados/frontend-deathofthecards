import React from 'react';
import PropTypes from 'prop-types';
import styles from '@/components/GameCard/GameCard.module.css';

const GameCard = ({ game }) => {
  const { name, minPlayers, maxPlayers, currentPlayers } = game;

  return (
    <div className={styles.card}>
      <h3 className={styles.gameName}>{name}</h3>
      <div className={styles.details}>
        <p>Jugadores: {currentPlayers}</p>
        <p>Límite: {minPlayers} - {maxPlayers}</p>
      </div>
      <button className={styles.joinButton}>Unirse</button>
    </div>
  );
};

GameCard.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    minPlayers: PropTypes.number.isRequired,
    maxPlayers: PropTypes.number.isRequired,
    currentPlayers: PropTypes.number.isRequired,
  }).isRequired,
};

export default GameCard;