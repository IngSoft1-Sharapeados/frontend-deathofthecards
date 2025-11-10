import React, { useState } from "react";
import styles from "./CardTradeModal.module.css";
import Card from "@/components/Card/Card";

const CardTradeModal = ({ isOpen, hand, onClose, onConfirm }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSending, setIsSending] = useState(false); //para evitar multiples sends
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedCard || isSending) return; // evita doble click
    setIsSending(true);

    try {
      await onConfirm(selectedCard); 
      onClose(); // cierra el modal apenas termina correctamente
    } catch (error) {
      console.error("[CardTradeModal] Error al confirmar:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Selecciona una carta para intercambiar</h2>
        <p>Elige una carta de tu mano para entregar al otro jugador.</p>

        <div className={styles.discardGrid}>
          {hand.map((card) => (
            <div
              key={card.id_instancia}
              className={`${styles.cardWrapper} ${
                selectedCard === card.id_instancia ? styles.selected : ""
              }`}
              onClick={() => setSelectedCard(card.id_instancia)}
            >
              <Card
                imageName={card.url}
                subfolder="game-cards"
                isDisabled={false}
              />
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button
            onClick={handleConfirm}
            className={styles.confirmButton}
            disabled={!selectedCard || isSending}
          >
            {isSending ? "Enviando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardTradeModal;