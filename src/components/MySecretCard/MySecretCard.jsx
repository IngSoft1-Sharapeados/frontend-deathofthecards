import React from 'react';
import Card from '@/components/Card/Card';
import styles from './MySecretCard.module.css';

// Ícono del ojo para indicar que está revelada
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" />
  </svg>
);

const MySecretCard = ({ secret }) => {
  if (!secret) return null;

  const wrapperClasses = `${styles.wrapper} ${!secret.revelada ? styles.hidden : ''}`;

  return (
    <div className={wrapperClasses}>
      {secret.revelada && (
        <div className={styles.revealedOverlay} data-testid="revealed-icon">
          <EyeIcon />
        </div>
      )}
      
      <Card imageName={secret.url} subfolder="secret-cards" />
    </div>
  );
};

export default MySecretCard;