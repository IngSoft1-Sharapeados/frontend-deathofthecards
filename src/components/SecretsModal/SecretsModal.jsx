import React from 'react';
import Card from '@/components/Card/Card';
import styles from './SecretsModal.module.css';
import secretCardBack from '@/assets/images/cards/misc/05-secret_back.png';

const SecretsModal = ({
  isOpen,
  onClose,
  player,
  secrets,
  isLoading,
  canRevealSecrets,
  selectedSecret,
  onSecretSelect,
  onRevealSecret
}) => {
  if (!isOpen) return null;

  const handleCardClick = (secretId, isFaceUp) => {
    if (!canRevealSecrets || isFaceUp) return; // solo los ocultos pueden clickearse
    onSecretSelect(secretId);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Secretos de {player?.nombre_jugador || ''}</h2>

        <div className={styles.secretsGrid}>
          {isLoading ? (
            <p>Cargando secretos...</p>
          ) : (
            secrets.map((secret) => {
              const isSelected = selectedSecret === secret.id;
              const isClickable = canRevealSecrets && !secret.bocaArriba;

              return (
                <div
                  key={secret.id}
                  className={`${styles.secretCard} ${isClickable ? styles.clickable : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleCardClick(secret.id, secret.bocaArriba)}
                >
                  {secret.bocaArriba ? (
                    <Card imageName={secret.url} subfolder="secret-cards" />
                  ) : (
                    <img
                      src={secretCardBack}
                      alt="Secreto oculto"
                      className={styles.hiddenCardImage}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Solo mostrar botón si puede revelar */}
        {canRevealSecrets && selectedSecret && (
          <button onClick={onRevealSecret} className={styles.revealButton}>
            Revelar secreto
          </button>
        )}

        <button onClick={onClose} className={styles.closeButton}>Cerrar</button>
      </div>
    </div>
  );
};

export default SecretsModal;
