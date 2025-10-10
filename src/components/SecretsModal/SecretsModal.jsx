import React from 'react';
import Card from '@/components/Card/Card';
import styles from './SecretsModal.module.css';
import secretCardBack from '@/assets/images/cards/misc/05-secret_back.png';

const SecretsModal = ({ isOpen, onClose, player, secrets, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Secretos de {player?.nombre_jugador || ''}</h2>
        <div className={styles.secretsGrid}>
          {isLoading ? (
            <p>Cargando secretos...</p>
          ) : (
            secrets.map((secret) => (
              <div key={secret.id} className={styles.secretCard}>
                {secret.bocaArriba ? (
                  <Card imageName={secret.url} subfolder="secret-cards" />
                ) : (
                  <img src={secretCardBack} alt="Secreto oculto" className={styles.hiddenCardImage} />
                )}
              </div>
            ))
          )}
        </div>
        <button onClick={onClose} className={styles.closeButton}>Cerrar</button>
      </div>
    </div>
  );
};

export default SecretsModal;