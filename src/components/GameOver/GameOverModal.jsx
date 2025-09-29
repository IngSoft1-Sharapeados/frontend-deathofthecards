import React from 'react';
import PropTypes from 'prop-types';
import styles from './GameOverModal.module.css';

const GameOverModal = ({ winners, asesinoGano, onReturnToMenu }) => {
  let mensaje = '';
  if (asesinoGano && winners.length === 1) {
    mensaje = `El asesino ${winners[0]} ganó la partida`;
  }
  else if (asesinoGano && winners.length > 1) {
    mensaje = `El asesino y su cómplice (${winners.join(', ')}) ganaron la partida`;
  }
  else {
    mensaje = `${winners.join(', ')} ${winners.length > 1 ? 'ganaron' : 'ganó'} la partida`;
  }
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>¡Fin de partida!</h2>
        <p className={styles.winnerText}>{mensaje}</p>
        <button onClick={onReturnToMenu} className={styles.returnButton}>
          Volver al menú principal
        </button>
      </div>
    </div>
  );
};

GameOverModal.propTypes = {
  winners: PropTypes.arrayOf(PropTypes.string).isRequired,
  asesinoGano: PropTypes.bool.isRequired,
  onReturnToMenu: PropTypes.func.isRequired,
};

export default GameOverModal;
