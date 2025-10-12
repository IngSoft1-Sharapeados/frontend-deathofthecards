import React from "react";
import styles from "./DiscardDeck.module.css";
import cardBack from "../../assets/images/cards/misc/01-card_back.png";
import Card from "../Card/Card"; // Importar tu componente Card existente

const DiscardDeck = ({ cards = [] }) => {
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
  const deckSize = cards.length;
    // Función para convertir ID a nombre de archivo
  const getImageNameFromId = (cardId) => {
    // Mapeo de IDs a nombres de archivo basado en tu estructura
    const idToImageMap = {
      7: "07-detective_poirot.png",
      8: "08-detective_marple.png",
      9: "09-detective_satterthwaite.png",
      10: "10-detective_pyne.png",
      11: "11-detective_brent.png",
      12: "12-detective_tommyberesford.png",
      13: "13-detective_tuppenceberesford.png",
      14: "14-detective_quin.png",
      15: "15-detective_oliver.png",
      16: "16-Instant_notsofast.png",
      17: "17-event_cardsonthetable.png",
      18: "18-event_anothervictim.png",
      19: "19-event_deadcardfolly.png",
      20: "20-event_lookashes.png",
      21: "21-event_cardtrade.png",
      22: "22-event_onemore.png",
      23: "23-event_delayescape.png",
      24: "24-event_earlytrain.png",
      25: "25-event_pointsuspicions.png",
      26: "26-devious_blackmailed.png",
      27: "27-devious_fauxpas.png"
    };
    
    return idToImageMap[cardId] || `card_${cardId}.png`; // fallback
  };

  return (
    <div className={styles.discardDeckWrapper}>
      <div className={styles.discardDeckContainer}>
        {deckSize > 0 && (
          <div className={styles.discardPileBackground}>
            {[...Array(Math.min(deckSize - 1, 5))].map((_, i) => (
              <img
                key={`bg-${i}`}
                src={cardBack}
                className={styles.discardPileCard}
                style={{
                  top: `${i * 2}px`,
                  left: `${i * 2}px`,
                  zIndex: i,
                }}
              />
            ))}
          </div>
        )}
        
        {topCard ? (
          <div className={styles.topCardContainer}>
            <Card 
              imageName={getImageNameFromId(topCard.id)} 
              className={styles.topCard}
              subfolder="game-cards"
            />
          </div>
        ) : (
          <div className={styles.emptyDiscard}>
            <img
              src={cardBack}
              className={styles.emptyDiscardImage}
            />
          </div>
        )}
        
      </div>
    </div>
  );
};

export default DiscardDeck;