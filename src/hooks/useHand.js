import { useState, useEffect } from "react";
import { cardService } from "@/services/cardService";

export const useHand = () => {
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(() => {
    const initialHand = cardService.getRandomHand();
    setHand(initialHand);
  }, []);

  const handleCardClick = (cardName) => {
    setSelectedCards((prevSelected) =>
      prevSelected.includes(cardName)
        ? prevSelected.filter((name) => name !== cardName)
        : [...prevSelected, cardName]
    );
  };

  const handleDiscard = () => {
    setHand((currentHand) =>
      currentHand.filter((card) => !selectedCards.includes(card))
    );
    setSelectedCards([]);
  };

  return {
    hand,
    selectedCards,
    handleCardClick,
    handleDiscard,
    isDiscardButtonEnabled: selectedCards.length > 0,
  };
};