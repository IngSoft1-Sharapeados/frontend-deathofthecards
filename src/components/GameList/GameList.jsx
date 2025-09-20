import React from 'react';
import PropTypes from 'prop-types';
import GameCard from '../GameCard/GameCard';
import styles from './GameList.module.css';

const GameList = ({ games = [] }) => {
  if (games.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hay partidas disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
};

GameList.propTypes = {
  games: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
};

export default GameList;