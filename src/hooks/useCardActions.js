import { useCallback } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';

const useCardActions = (gameId, gameState) => {
  const {
    hand, setHand, selectedDraftCards, draftCards,
    selectedCards, setSelectedCards,
    currentPlayerId,
    isMyTurn,
    playerTurnState, setPlayerTurnState, setSelectedDraftCards,
    hasPlayedSetThisTurn, setHasPlayedSetThisTurn
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
    // Allow selecting from draft while drawing OR if a set was played and hand < 6
    const canSelectFromDraft = playerTurnState === 'drawing' || (hasPlayedSetThisTurn && hand.length < 6);
    if (!isMyTurn || !canSelectFromDraft) return;

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
  }, [isMyTurn, playerTurnState, hasPlayedSetThisTurn, setSelectedDraftCards, hand.length]);

  const handleDiscard = useCallback(async () => {
    if (selectedCards.length === 0 || !isMyTurn) return;
    try {
      const cardIdsToDiscard = selectedCards
        .map(instanceId => hand.find(c => c.instanceId === instanceId)?.id)
        .filter(id => id !== undefined);

      await apiService.discardCards(gameId, currentPlayerId, cardIdsToDiscard);

  // Use functional update to avoid races with other state updates
  setHand(prev => prev.filter(card => !selectedCards.includes(card.instanceId)));
      setSelectedCards([]);

      // If after discarding you still have 6 or more, remain discarding.
      // Otherwise, move to drawing to fill up to 6.
      setPlayerTurnState(prev => {
        // We don't know new hand size synchronously here due to async state, so infer using prev hand and selected
        const remaining = hand.filter(c => !selectedCards.includes(c.instanceId)).length;
        return remaining < 6 ? 'drawing' : 'discarding';
      });

    } catch (error) {
      console.error("Error al descartar:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, hand, selectedCards, isMyTurn, setHand, setSelectedCards, setPlayerTurnState]);



  const handlePickUp = useCallback(async () => {
    // Allow pickup if drawing OR if a set was played this turn (and you haven't reached 6 yet)
    if (!isMyTurn || !(playerTurnState === 'drawing' || (hasPlayedSetThisTurn && hand.length < 6))) {
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

  // 4. Reset local state. Phase control: if still below 6 after pickup, remain in drawing; if reached 6, end drawing phase here.
      setSelectedDraftCards([]);

      // 5. Ensure UI matches backend: fetch authoritative hand after pickup
      try {
        const freshHandData = await apiService.getHand(gameId, currentPlayerId);
        const playingHand = cardService.getPlayingHand(freshHandData);
        const handWithInstanceIds = playingHand.map((card, index) => ({
          ...card,
          instanceId: `${card.id}-sync-${Date.now()}-${index}`,
        }));
        setHand(handWithInstanceIds);
      } catch (e) {
        // Non-fatal: keep optimistic hand if sync fails
        console.warn('No se pudo sincronizar la mano después de levantar:', e);
      }

    } catch (error) {
      console.error("Error al levantar cartas:", error);
      alert(`Error: ${error.message}`);
    }
  }, [
    gameId, currentPlayerId, isMyTurn, playerTurnState,
    selectedDraftCards, draftCards, setHand, setSelectedDraftCards,
    hasPlayedSetThisTurn, hand.length
  ]);

  const handlePlay = useCallback(async () => {
    // Only allow during discarding phase and player's turn
    if (!isMyTurn || playerTurnState !== 'discarding') return;
    // Validate selection
    if (!isValidDetectiveSet(hand, selectedCards)) return;

  try {
      // Map selected instance IDs to card ids
      const cardIdsToPlay = selectedCards
        .map((instanceId) => hand.find((c) => c.instanceId === instanceId)?.id)
        .filter((id) => id !== undefined);

      // If backend supports a play endpoint, call it here. Otherwise, optimistically remove from hand.
      if (apiService.playDetectiveSet) {
        await apiService.playDetectiveSet(gameId, currentPlayerId, cardIdsToPlay);
      }

      // Update local hand and clear selection
      // Use functional update to avoid races with pickup updates
      setHand(prev => prev.filter(card => !selectedCards.includes(card.instanceId)));
      setSelectedCards([]);
      // Mark that a set was played this turn. Allow either discard or pickup now.
      setHasPlayedSetThisTurn(true);
      setPlayerTurnState('discarding');
    } catch (error) {
      console.error('Error al jugar set de detectives:', error);
      alert(`Error: ${error.message}`);
    }
  }, [isMyTurn, playerTurnState, hand, selectedCards, setHand, setSelectedCards, gameId, currentPlayerId, setHasPlayedSetThisTurn]);

  return {
    handleCardClick,
    handleDraftCardClick,
    handleDiscard,
    handlePickUp,
    handlePlay,
  };
};

export const useSecrets = (gameId, gameState) => {
  const {
    setIsSecretsModalOpen,
    setViewingSecretsOfPlayer,
    setPlayerSecretsData,
    setIsSecretsLoading,
  } = gameState;

  const handleOpenSecretsModal = useCallback(async (player) => {
    setViewingSecretsOfPlayer(player);
    setIsSecretsModalOpen(true);
    setIsSecretsLoading(true);

    try {
      const secretsFromApi = await apiService.getPlayerSecrets(gameId, player.id_jugador);
      console.log(secretsFromApi)
      
      const processedSecrets = secretsFromApi.map(secret => {
        if (secret.bocaArriba && secret.carta_id) {
          const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
          return { ...secret, url: cardDetails?.url };
        }
        return secret;
      });
      setPlayerSecretsData(processedSecrets);

    } catch (error) {
      console.error("Error al obtener los secretos del jugador:", error);
      setPlayerSecretsData([]);
    } finally {
      setIsSecretsLoading(false);
    }
  }, [gameId, setViewingSecretsOfPlayer, setIsSecretsModalOpen, setIsSecretsLoading, setPlayerSecretsData]);

  const handleCloseSecretsModal = useCallback(() => {
    setIsSecretsModalOpen(false);
    setViewingSecretsOfPlayer(null);
    setPlayerSecretsData([]);
  }, [setIsSecretsModalOpen, setViewingSecretsOfPlayer, setPlayerSecretsData]);

  return { handleOpenSecretsModal, handleCloseSecretsModal };
};

export default useCardActions;