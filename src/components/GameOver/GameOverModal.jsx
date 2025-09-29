import React from 'react';
import PropTypes from 'prop-types';
import styles from './GameOverModal.module.css';

const GameOverModal = ({ winners, onReturnToMenu }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>¡Victoria!</h2>
        <p className={styles.winnerText}>
          {winners.join(', ')} {winners.length > 1 ? 'ganaron' : 'ganó'} la partida
        </p>
        <button onClick={onReturnToMenu} className={styles.returnButton}>
          Volver al menú principal
        </button>
      </div>
    </div>
  );
};

GameOverModal.propTypes = {
  winners: PropTypes.arrayOf(PropTypes.string).isRequired,
  onReturnToMenu: PropTypes.func.isRequired,
};

export default GameOverModal;
