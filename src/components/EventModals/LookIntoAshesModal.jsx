import Card from '@/components/Card/Card';
import styles from './LookIntoAshesModal.module.css';

const LookIntoAshesModal = ({
  isOpen,
  onClose,
  discardCards,
  selectedCard,
  onCardSelect,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Look Into The Ashes</h2>
        <p>Selecciona una carta del descarte para agregar a tu mano:</p>
        
        <div className={styles.discardGrid}>
          {discardCards.map((card) => (
            <div 
              key={card.instanceId}
              className={`${styles.cardWrapper} ${
                selectedCard === card.instanceId ? styles.selected : ''
              }`}
              onClick={() => onCardSelect(card.instanceId)}
            >
              <Card 
                imageName={card.url} 
                subfolder="game-cards"
              />
            </div>
          ))}
        </div>
        
        <div className={styles.modalActions}>
          <button 
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={!selectedCard}
            className={styles.confirmButton}
          >
            Elegir Carta
          </button>
        </div>
      </div>
    </div>
  );
};

export default LookIntoAshesModal;