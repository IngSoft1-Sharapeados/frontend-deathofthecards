import React from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.css';

// 1. Agregamos 'subfolder' a la lista de props.
const Card = ({ imageName, isSelected, onCardClick, subfolder }) => {
  let imageUrl = null;

  // Comprobación para evitar errores si imageName no existe
  if (imageName) {
    // 2. Usamos la prop 'subfolder' para construir la ruta dinámicamente.
    imageUrl = new URL(`../../assets/images/cards/${subfolder}/${imageName}`, import.meta.url).href;
  }

  const cardClasses = `${styles.card} ${isSelected ? styles.selected : ''}`;

  if (!imageUrl) {
    return null; // No renderiza nada si no hay imagen
  }

  return (
    // Se simplifica el onClick para que sea más claro
    <div className={cardClasses} onClick={onCardClick}>
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
  onCardClick: () => {},
  subfolder: 'game-cards' // 4. Valor por defecto para que las cartas de la mano sigan funcionando sin cambios.
};

export default Card;