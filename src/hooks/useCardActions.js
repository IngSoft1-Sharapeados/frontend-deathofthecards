import { useCallback } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';

const useCardActions = (gameId, gameState) => {
  const {
    hand, setHand,
    selectedCards, setSelectedCards,
    currentPlayerId,
    isMyTurn
  } = gameState;

  const handleCardClick = useCallback((instanceId) => {
    if (!isMyTurn) {
      console.log("No es tu turno para seleccionar cartas.");
      return;
    }
    setSelectedCards((prev) => 
      prev.includes(instanceId) 
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    );
  }, [isMyTurn, setSelectedCards]);

  const handleDiscard = useCallback(async () => {
    if (selectedCards.length === 0 || !isMyTurn) return;

    try {
      const cardIdsToDiscard = selectedCards
        .map(instanceId => hand.find(c => c.instanceId === instanceId)?.id)
        .filter(id => id !== undefined);

      // 1. Descartar cartas en el backend
      await apiService.discardCards(gameId, currentPlayerId, cardIdsToDiscard);

      // 2. Actualizar la mano localmente
      const newHand = hand.filter(card => !selectedCards.includes(card.instanceId));
      setHand(newHand);
      setSelectedCards([]);

      // 3. Robar automáticamente hasta tener 6 cartas
      const needed = Math.max(0, 6 - newHand.length);
      if (needed > 0) {
        const drawnCards = await apiService.drawCards(gameId, currentPlayerId, needed);
        const mappedDrawn = cardService.getPlayingHand(drawnCards).map((card, index) => ({
          ...card,
          instanceId: `${card.id}-draw-${Date.now()}-${index}`
        }));
        setHand(prev => [...prev, ...mappedDrawn]);
      }

    } catch (error) {
      console.error("Error al descartar/robar:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, hand, selectedCards, isMyTurn, setHand, setSelectedCards]);

  return {
    handleCardClick,
    handleDiscard
  };
};

export default useCardActions;