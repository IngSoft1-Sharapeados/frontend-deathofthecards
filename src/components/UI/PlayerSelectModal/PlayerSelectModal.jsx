import React from 'react';
import styles from './PlayerSelectModal.module.css';

const PlayerSelectModal = ({ isOpen, onClose, players = [], title = 'Seleccionar jugador', onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <ul className={styles.list}>
          {players.map((p) => (
            <li key={p.id_jugador}>
              <button className={styles.playerButton} onClick={() => onSelect?.(p)}>
                {p.nombre_jugador}
              </button>
            </li>
          ))}
        </ul>
        <button className={styles.closeButton} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

export default PlayerSelectModal;
