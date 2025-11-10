import React from 'react';
import styles from './PlayerSelectionModal.module.css';
import userIcon from '@/assets/images/cards/misc/user-icon.svg';

const PlayerSelectionModal = ({
  isOpen,
  onClose,
  players,
  onPlayerSelect,
  title,
  loadingMessage,
  hideCloseButton
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{title || 'Seleccionar Jugador'}</h2>

        {loadingMessage ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>{loadingMessage}</p>
          </div>
        ) : (
          <div className={styles.playerList}>
            {players.map(player => (
              <button
                key={player.id_jugador}
                className={styles.playerButton}
                onClick={() => onPlayerSelect(player.id_jugador)}
              >
                <img src={userIcon} alt="Player Icon" className={styles.playerIcon} />
                {player.nombre_jugador}
              </button>
            ))}
          </div>
        )}

        {!hideCloseButton && (
          <button onClick={onClose} className={styles.closeButton}>Cancelar</button>
        )}

      </div>
    </div>
  );
};

export default PlayerSelectionModal;