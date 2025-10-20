import React, { useState } from 'react';
import styles from './ConfirmationModal.module.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [amount, setAmount] = useState(1);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(amount);
  };

  const handleAmountChange = (e) => {
    const value = Math.max(1, Math.min(5, Number(e.target.value)));
    setAmount(value);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className={styles.message}>{message}</p>
        
        <input
          type="number"
          min="1"
          max="5"
          value={amount}
          onChange={handleAmountChange}
          className={styles.amountInput}
        />

        <div className={styles.buttonGroup}>
          <button onClick={onClose} className={styles.cancelButton}>Cancelar</button>
          <button onClick={handleConfirm} className={styles.confirmButton}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;