import React from 'react';
import PropTypes from 'prop-types';
import GameCard from '@/components/GameCard/GameCard.jsx';
import styles from '@/components/GameList/GameList.module.css';

const GameList = ({ games = [] }) => {
  if (games.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hay partidas disponibles</p>
      </div>
    );
  }
console.log("Partidas recibidas:", games);
  return (
    <div className={styles.listContainer}>
      
      {games.map((game, index) => (
        <GameCard key={game.id} game={game} index={index} />
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