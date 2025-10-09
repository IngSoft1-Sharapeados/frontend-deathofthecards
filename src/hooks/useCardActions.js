import { useCallback } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';

const useCardActions = (gameId, gameState) => {
  const {
    hand, setHand, selectedDraftCards, draftCards,
    selectedCards, setSelectedCards,
    currentPlayerId,
    isMyTurn,
    playerTurnState, setPlayerTurnState, setSelectedDraftCards
  } = gameState;

  const handleCardClick = useCallback((instanceId) => {
    if (!isMyTurn || playerTurnState !== 'discarding') return;
    setSelectedCards((prev) =>
      prev.includes(instanceId)
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    );
  }, [isMyTurn, playerTurnState, setSelectedCards]);

  const handleDraftCardClick = useCallback((instanceId) => {
    if (!isMyTurn || playerTurnState !== 'drawing') return;

    const slotsAvailable = 6 - hand.length;

    setSelectedDraftCards(prev => {
      if (prev.includes(instanceId)) {
        return prev.filter(id => id !== instanceId);
      }
      if (prev.length < slotsAvailable) {
        return [...prev, instanceId];
      }
      return prev;
    });
  }, [isMyTurn, playerTurnState, setSelectedDraftCards, hand.length]);

  const handleDiscard = useCallback(async () => {
    if (selectedCards.length === 0 || !isMyTurn) return;
    try {
      const cardIdsToDiscard = selectedCards
        .map(instanceId => hand.find(c => c.instanceId === instanceId)?.id)
        .filter(id => id !== undefined);

      await apiService.discardCards(gameId, currentPlayerId, cardIdsToDiscard);

      const newHand = hand.filter(card => !selectedCards.includes(card.instanceId));
      setHand(newHand);
      setSelectedCards([]);

      // Switch to the 'drawing' phase
      setPlayerTurnState('drawing');

    } catch (error) {
      console.error("Error al descartar:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, hand, selectedCards, isMyTurn, setHand, setSelectedCards, setPlayerTurnState]);



  const handlePickUp = useCallback(async () => {
    if (!isMyTurn || playerTurnState !== 'drawing') {
      return;
    }

    try {
      // 1. Get the IDs of the cards selected from the draft
      const draftCardIdsToTake = selectedDraftCards
        .map(instanceId => draftCards.find(c => c.instanceId === instanceId)?.id)
        .filter(id => id !== undefined);

      // 2. Call the new unified API endpoint
      const allNewCards = await apiService.pickUpCards(gameId, currentPlayerId, draftCardIdsToTake);

      // 3. Update the hand with the authoritative response from the backend
      if (allNewCards && allNewCards.length > 0) {
        const newCardsWithDetails = cardService.getPlayingHand(allNewCards).map((card, index) => ({
          ...card,
          instanceId: `${card.id}-pickup-${Date.now()}-${index}`
        }));
        setHand(prevHand => [...prevHand, ...newCardsWithDetails]);
      }

      // 4. Reset local state. No need to set playerTurnState, as the
      //    backend now controls the turn and will notify us via WebSocket.
      setSelectedDraftCards([]);

    } catch (error) {
      console.error("Error al levantar cartas:", error);
      alert(`Error: ${error.message}`);
    }
  }, [
    gameId, currentPlayerId, isMyTurn, playerTurnState,
    selectedDraftCards, draftCards, setHand, setSelectedDraftCards
  ]);

  return {
    handleCardClick,
    handleDraftCardClick,
    handleDiscard,
    handlePickUp,
  };
};

export default useCardActions;