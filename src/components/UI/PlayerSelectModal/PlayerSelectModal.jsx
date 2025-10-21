import React from 'react';
import styles from './PlayerSelectModal.module.css';
import PlayerSelectTable from '@/components/UI/PlayerSelectTable/PlayerSelectTable.jsx';

const PlayerSelectModal = ({ isOpen, onClose, players = [], title = 'Seleccionar jugador', onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <PlayerSelectTable players={players} onSelect={onSelect} />
        <button className={styles.closeButton} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

export default PlayerSelectModal;
