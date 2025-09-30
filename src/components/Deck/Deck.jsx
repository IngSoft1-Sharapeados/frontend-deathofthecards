import React from "react";
import styles from "./Deck.module.css";
import cardBack from "../../assets/images/cards/misc/01-card_back.png";

const Deck = ({ count }) => {
  const visibleCards = Math.min(count, 6);

    return (
      <div className={styles.deckWrapper}>
        <div className={styles.deckContainer}>
          {[...Array(visibleCards)].map((_, i) => (
            <img
              key={i}
              src={cardBack}
              alt="Mazo de cartas"
              className={styles.deckImage}
              style={{
                top: `${i * 2}px`,
                left: `${i * 2}px`,
                zIndex: i,
              }}
            />
          ))}
        </div>
        <span className={styles.counter}>{count}</span>
      </div>
    );
};
export default Deck;
