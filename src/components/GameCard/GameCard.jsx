import React from 'react';
import PropTypes from 'prop-types';
import styles from '@/components/GameCard/GameCard.module.css';

const GameCard = ({ game, index, onJoinClick }) => { 
  const {name, minPlayers, maxPlayers, currentPlayers } = game;

  
  const cardStyle = {
    animationDelay: `${index * 100}ms` 
  };

  return (
    <div className={`${styles.card} ${styles.cardAnimated}`} style={cardStyle}>
      <h3 className={styles.gameName}>{name}</h3>
      <div className={styles.details}>
        <p>Jugadores: {currentPlayers}</p>
        <p>Límite: {minPlayers} - {maxPlayers}</p>
      </div>
      <button className={styles.joinButton} onClick={() => onJoinClick(game.id)}>Unirse</button>
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
  
  index: PropTypes.number.isRequired, 
  onJoinClick: PropTypes.func.isRequired
};

export default GameCard;