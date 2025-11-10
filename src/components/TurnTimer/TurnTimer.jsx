import React from 'react';
import styles from './TurnTimer.module.css';

const TurnTimer = ({ timeLeft, maxTime }) => {
  // Radio y circunferencia para el círculo SVG
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  // Calcula cuánto del círculo se debe "vaciar"
  const offset = circumference - (timeLeft / maxTime) * circumference;

  let strokeColorClass = styles.timerPathRemaining;
  if (timeLeft <= 5) {
    strokeColorClass = styles.timerPathWarning; // Se pone rojo
  }

  return (
    <div className={styles.timerContainer} title={`Tiempo restante: ${timeLeft}s`}>
      <svg
        className={styles.timerSvg}
        width="60"
        height="60"
        viewBox="0 0 60 60"
      >
        {/* Círculo de fondo (el gris) */}
        <circle
          className={styles.timerPathElapsed}
          cx="30"
          cy="30"
          r={radius}
        />
        {/* Círculo de progreso (el que se vacía) */}
        <circle
          className={`${styles.timerPathRemaining} ${strokeColorClass}`}
          cx="30"
          cy="30"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset} 
        />
      </svg>
      <span className={styles.timerLabel}>{timeLeft}</span>
    </div>
  );
};

export default TurnTimer;