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
  canHideSecrets,
  canRobSecrets,
  selectedSecret,
  onSecretSelect,
  onRevealSecret,
  onHideSecret,
  onRobSecret
}) => {
  if (!isOpen) return null;
  
  // Debug logs
  console.log('🔍 SecretsModal ABIERTO - Estado inicial:', {
    selectedSecret,
    tipoDeSelectedSecret: typeof selectedSecret,
    canRevealSecrets,
    canHideSecrets,
    secrets: secrets?.map(s => ({ 
      id: s.id, 
      tipoDeId: typeof s.id,
      bocaArriba: s.bocaArriba,
      url: s.url 
    }))
  });

  const handleCardClick = (secretId, isFaceUp) => {
    console.log('Click en carta - secretId:', secretId, 'isFaceUp:', isFaceUp);
    
    const canClick = (!isFaceUp && canRevealSecrets) || (isFaceUp && canHideSecrets);
    if (!canClick) {
      console.log('Click bloqueado - no se puede interactuar');
      return;
    }
    
    console.log('Llamando onSecretSelect con ID:', secretId);
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
              const isClickable =
                (!secret.bocaArriba && canRevealSecrets) ||
                (secret.bocaArriba && canHideSecrets);

              return (
                <div
                  key={secret.id}
                  className={`${styles.secretCard} ${
                    isClickable ? styles.clickable : ''
                  } ${isSelected ? styles.selected : ''}`}
                  onClickCapture={(e) => {
                    e.stopPropagation();
                    handleCardClick(secret.id, secret.bocaArriba);
                  }}
                  data-secret-id={secret.id}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                >
                  {secret.bocaArriba ? (
                    <Card 
                      imageName={secret.url} 
                      subfolder="secret-cards"
                    />
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

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className={styles.buttonsContainer}>
          {/* Botón de revelar: solo si la carta seleccionada está oculta */}
          {canRevealSecrets &&
            selectedSecret &&
            !secrets.find((s) => s.id === selectedSecret)?.bocaArriba && (
              <button onClick={onRevealSecret} className={styles.revealButton}>
                Revelar secreto
              </button>
            )}

          {/* Botón de ocultar: solo si la carta seleccionada está revelada */}
          {canHideSecrets &&
            selectedSecret &&
            secrets.find((s) => s.id === selectedSecret)?.bocaArriba && (
              <button onClick={onHideSecret} className={styles.revealButton}>
                Ocultar secreto
              </button>
            )}
          {/* Botón de robar: solo si la carta seleccionada está revelada */}
          {canRobSecrets &&
            selectedSecret &&
            secrets.find((s) => s.id === selectedSecret)?.bocaArriba && (
              <button onClick={onRobSecret} className={styles.revealButton}>
                Robar secreto
              </button>
            )}
          <button onClick={onClose} className={styles.closeButton}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecretsModal;