import React from 'react';
import Card from '@/components/Card/Card';
import styles from './SecretsModal.module.css';
import secretCardBack from '@/assets/images/cards/misc/05-secret_back.png';


// Enhanced modal supporting click affordances and optional action buttons

const SecretsModal = ({
  isOpen,
  onClose,
  player,
  secrets,
  isLoading,

  // selection behavior (used by detective/lady/parker flows)
  selectable = false,
  onSelect, // legacy
  onSecretSelect, // preferred: returns secret id
  selectRevealedOnly = false,
  // optional reveal/hide capability flags and actions
  canRevealSecrets,
  canHideSecrets,
  canRobSecrets,
  selectedSecret,
  onRevealSecret,
  onHideSecret,
  onRobSecret,
  hideCloseButton = false,

}) => {
  if (!isOpen) return null;
  

  return (
    <div className={styles.overlay} onClick={hideCloseButton ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Secretos de {player?.nombre_jugador || ''}</h2>

        <div className={styles.secretsGrid}>
          {isLoading ? (
            <p>Cargando secretos...</p>
          ) : (
            secrets.map((secret) => {

              const isRevealed = secret.bocaArriba || secret.revelada || secret.revelado;
              const allowSelect = selectable && !isLoading && (selectRevealedOnly ? isRevealed : !isRevealed);
              const isClickableByFlags = (!isRevealed && canRevealSecrets) || (isRevealed && canHideSecrets);
              const isClickable = allowSelect || isClickableByFlags;
              const isSelected = selectedSecret === secret.id;

              const handleClick = (e) => {
                e.stopPropagation();
                if (!isClickable) return;
                // Prefer id-based selection; keep legacy support
                if (onSecretSelect) onSecretSelect(secret.id);
                else if (onSelect) onSelect(secret);
              };
              return (
                <div
                  key={secret.id}
                  className={`${styles.secretCard} ${isClickable ? styles.clickable : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={handleClick}
                  role={isClickable ? 'button' : undefined}
                >
                  {isRevealed && secret.url ? (
                    <Card imageName={secret.url} subfolder="secret-cards" />
                  ) : (
                    <img src={secretCardBack} alt="Secreto oculto" className={styles.hiddenCardImage} />

                  )}
                </div>
              );
            })

          )}
        </div>
        <div className={styles.buttonsContainer}>
          {canRevealSecrets && selectedSecret && !secrets.find(s => s.id === selectedSecret)?.bocaArriba && (
            <button onClick={onRevealSecret} className={styles.revealButton}>Revelar secreto</button>
          )}
          {canHideSecrets && selectedSecret && secrets.find(s => s.id === selectedSecret)?.bocaArriba && (
            <button onClick={onHideSecret} className={styles.revealButton}>Ocultar secreto</button>
          )}
          {canRobSecrets && selectedSecret && secrets.find(s => s.id === selectedSecret)?.bocaArriba && (
            <button onClick={onRobSecret} className={styles.revealButton}>Robar secreto</button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SecretsModal;