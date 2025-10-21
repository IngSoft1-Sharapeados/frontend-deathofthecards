import React from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.css';

// 1. Agregamos 'subfolder' a la lista de props.
const Card = ({ imageName, isSelected, onCardClick, subfolder, isGlowing, isDisabled }) => {
  let imageUrl = null;

  // Comprobación para evitar errores si imageName no existe
  if (imageName) {
    // 2. Usamos la prop 'subfolder' para construir la ruta dinámicamente.
    imageUrl = new URL(`../../assets/images/cards/${subfolder}/${imageName}`, import.meta.url).href;
  }

  const cardClasses = `${styles.card} ${isSelected ? styles.selected : ''} ${isGlowing ? styles.glowing : ''} ${isDisabled ? styles.disabled : ''}`;

  if (!imageUrl) {
    return null; // No renderiza nada si no hay imagen
  }

  return (
    <div className={cardClasses} onClick={!isDisabled ? onCardClick : undefined}>
      <img src={imageUrl} alt={`Carta ${imageName}`} className={styles.cardImage} />
    </div>
  );
};

Card.propTypes = {
  imageName: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  onCardClick: PropTypes.func,
  subfolder: PropTypes.string // 3. Se define la nueva prop.
};

Card.defaultProps = {
  isSelected: false,
  onCardClick: () => { },
  subfolder: 'game-cards',
  isGlowing: false,
  isDisabled: false,
};


export default Card;