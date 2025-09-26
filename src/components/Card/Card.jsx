import React from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.css';

const Card = ({ imageName, isSelected, onCardClick }) => {
  const imageUrl = new URL(`../../assets/images/cards/game-cards/${imageName}`, import.meta.url).href;

  const cardClasses = `${styles.card} ${isSelected ? styles.selected : ''}`;

  return (
    <div className={cardClasses} onClick={() => onCardClick(imageName)}>
      <img src={imageUrl} alt={`Carta ${imageName}`} className={styles.cardImage} />
    </div>
  );
};

Card.propTypes = {
  imageName: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  onCardClick: PropTypes.func 
};

Card.defaultProps = {
  isSelected: false,
  onCardClick: () => {},
};

export default Card;