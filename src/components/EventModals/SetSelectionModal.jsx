import React from 'react';
import Card from '@/components/Card/Card';
import styles from './SetSelectionModal.module.css';
import { cardService } from '@/services/cardService';

const SetSelectionModal = ({ isOpen, onClose, opponentSets, players, onSetSelect, title }) => {
  if (!isOpen) return null;

  // Obtenemos los IDs de los jugadores que tienen sets para mostrar sus nombres
  const playerIdsWithSets = Object.keys(opponentSets);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{title || 'Seleccionar un Set'}</h2>
        <div className={styles.playerSetsContainer}>
          {playerIdsWithSets.length > 0 ? (
            playerIdsWithSets.map(playerId => {
              const playerName = players.find(p => p.id_jugador == playerId)?.nombre_jugador || `Jugador ${playerId}`;
              return (
                <div key={playerId} className={styles.playerSection}>
                  <h3 className={styles.playerName}>{playerName}</h3>
                  <div className={styles.setsGrid}>
                    {opponentSets[playerId].map(set => (
                      <div
                        key={`${set.jugador_id}-${set.representacion_id_carta}`}
                        className={styles.setWrapper}
                        onClick={() => onSetSelect(set)}
                      >
                        <Card imageName={cardService.getPlayingHand([{id: set.representacion_id_carta}])[0].url} subfolder="game-cards" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className={styles.noSetsMessage}>Ningún oponente ha jugado sets.</p>
          )}
        </div>
        <button onClick={onClose} className={styles.closeButton}>Cancelar</button>
      </div>
    </div>
  );
};

export default SetSelectionModal;