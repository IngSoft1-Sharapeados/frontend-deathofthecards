import React, { useEffect } from 'react';
import styles from './ActionResultToast.module.css'; // (Crearás este CSS)

const ActionResultToast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // El toast dura 3 segundos

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={styles.toast}>
      {message}
    </div>
  );
};

export default ActionResultToast;