import React, { useEffect, useState } from 'react';
import Card from '@/components/Card/Card';
import { cardService } from '@/services/cardService';
import styles from './ActionStackModal.module.css'; // (Crearás este CSS)

const ActionStackModal = ({ accion, durationSeconds = 5 }) => {
  const [timer, setTimer] = useState(durationSeconds);

  useEffect(() => {
    if (accion) {
      // Reinicia el timer cada vez que la acción cambia
      setTimer(durationSeconds);
      const interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [accion, durationSeconds]); // Depende del objeto de acción

  // --- GUARDIA DE SEGURIDAD ---
  // Si no hay acción, o si la acción aún no tiene una carta original
  // (porque el estado se está actualizando), no renderiza nada.
  if (!accion || !accion.carta_original) return null;
  // --- FIN DE GUARDIA ---

  const { carta_original, pila_respuestas } = accion;
  const timerPercentage = (timer / durationSeconds) * 100;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>¡Acción en Progreso!</h2>
        
        <div className={styles.timerBar}>
          <div 
            className={styles.timerProgress} 
            style={{ width: `${timerPercentage}%` }} 
          />
        </div>
        
        <p className={styles.message}>Respondiendo a:</p>
        <div className={styles.cardContainer}>
          <Card 
            imageName={cardService.getCardImageUrl(carta_original.id_carta_tipo)} 
            subfolder="game-cards" 
          />
          <span className={styles.cardLabel}>{carta_original.nombre || accion.nombre_accion}</span>
        </div>

        {pila_respuestas.length > 0 && (
          <>
            <p className={styles.message}>Respuestas en la Pila:</p>
            <div className={styles.responseStack}>
              {pila_respuestas.filter(Boolean).map((resp, index) => (
                <div key={index} className={styles.cardContainerMini}>
                  <Card 
                    imageName={cardService.getCardImageUrl(resp.id_carta_tipo)} 
                    subfolder="game-cards" 
                  />
                </div>
              ))}
            </div>
            <p className={styles.statusMessage}>
              {pila_respuestas.length % 2 === 0 
                ? "La acción original se ejecutará." 
                : "La acción original será cancelada."
              }
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionStackModal;