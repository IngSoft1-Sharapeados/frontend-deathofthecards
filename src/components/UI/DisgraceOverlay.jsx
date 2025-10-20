import React from 'react';
import styles from './DisgraceOverlay.module.css';

const DisgraceOverlay = () => {
  return (
    <div className={styles.banner}>
      <span className={styles.icon}>🤡</span>
      <div className={styles.textContainer}>
        <p className={styles.message}>Estás en Desgracia Social</p>
        <small className={styles.instruction}>Solo puedes descartar 1 carta para pasar.</small>
      </div>
    </div>
  );
};

export default DisgraceOverlay;