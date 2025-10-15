import React from 'react';
import Card from '@/components/Card/Card';
import styles from './SecretsModal.module.css';
import secretCardBack from '@/assets/images/cards/misc/05-secret_back.png';

// When `selectable` is true, clicking a secret invokes onSelect(secret) and closes optionally
const SecretsModal = ({ isOpen, onClose, player, secrets, isLoading, selectable = false, onSelect, selectRevealedOnly = false }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Secretos de {player?.nombre_jugador || ''}</h2>
        <div className={styles.secretsGrid}>
          {isLoading ? (
            <p>Cargando secretos...</p>
          ) : (
            secrets.map((secret) => {
              const isRevealed = secret.bocaArriba || secret.revelada || secret.revelado;
              const canSelect = selectable && !isLoading && (
                selectRevealedOnly ? isRevealed : !isRevealed
              );
              const handleClick = () => {
                if (!canSelect) return;
                if (onSelect) onSelect(secret);
              };
              return (
                <button
                  key={secret.id}
                  className={styles.secretCard}
                  onClick={handleClick}
                  disabled={!canSelect}
                >
                  {isRevealed && secret.url ? (
                    <Card imageName={secret.url} subfolder="secret-cards" />
                  ) : (
                    <img src={secretCardBack} alt="Secreto oculto" className={styles.hiddenCardImage} />
                  )}
                </button>
              );
            })
          )}
        </div>
        <button onClick={onClose} className={styles.closeButton}>Cerrar</button>
      </div>
    </div>
  );
};

export default SecretsModal;