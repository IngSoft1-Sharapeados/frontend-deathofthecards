import { useCallback } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';
import { isValidEventCard } from '@/utils/eventCardValidation';

const CARD_IDS = {
  CARDS_OFF_THE_TABLE: 17,
  ANOTHER_VICTIM: 18,
  DEAD_CARD_FOLLY: 19,
  LOOK_ASHES: 20,
  CARD_TRADE: 21,
  ONE_MORE: 22,
  DELAY_ESCAPE: 23,
  EARLY_TRAIN: 24,
  POINT_SUSPICIONS: 25,
};

const useCardActions = (gameId, gameState) => {
  const {
    hand, setHand, selectedDraftCards, draftCards,
    selectedCards, setSelectedCards,
    currentPlayerId,
    isMyTurn, players,
    playerTurnState, setPlayerTurnState, setSelectedDraftCards,
    hasPlayedSetThisTurn, setHasPlayedSetThisTurn,
    setPlayerSelectionModalOpen, setEventCardToPlay, eventCardToPlay, setSetSelectionModalOpen
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

      setHand(prev => prev.filter(card => !selectedCards.includes(card.instanceId)));
      setSelectedCards([]);

      setPlayerTurnState(prev => {
        const remaining = hand.filter(c => !selectedCards.includes(c.instanceId)).length;
        return remaining < 6 ? 'drawing' : 'discarding';
      });

    } catch (error) {
      console.error("Error al descartar:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, hand, selectedCards, isMyTurn, setHand, setSelectedCards, setPlayerTurnState]);

  const handlePickUp = useCallback(async () => {
    if (!isMyTurn || !(playerTurnState === 'drawing' || (hasPlayedSetThisTurn && hand.length < 6))) {
      return;
    }

    try {
      const draftCardIdsToTake = selectedDraftCards
        .map(instanceId => draftCards.find(c => c.instanceId === instanceId)?.id)
        .filter(id => id !== undefined);

      const allNewCards = await apiService.pickUpCards(gameId, currentPlayerId, draftCardIdsToTake);

      if (allNewCards && allNewCards.length > 0) {
        const newCardsWithDetails = cardService.getPlayingHand(allNewCards).map((card, index) => ({
          ...card,
          instanceId: `${card.id}-pickup-${Date.now()}-${index}`
        }));
        setHand(prevHand => [...prevHand, ...newCardsWithDetails]);
      }

      setSelectedDraftCards([]);

      try {
        const freshHandData = await apiService.getHand(gameId, currentPlayerId);
        const playingHand = cardService.getPlayingHand(freshHandData);
        const handWithInstanceIds = playingHand.map((card, index) => ({
          ...card,
          instanceId: `${card.id}-sync-${Date.now()}-${index}`,
        }));
        setHand(handWithInstanceIds);
      } catch (e) {
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

  const handleEventActionConfirm = async (payload) => {
    if (!eventCardToPlay) return;

    try {
      const { id: cardId, instanceId } = eventCardToPlay;

      const playerName = players.find(p => p.id_jugador === currentPlayerId)?.nombre_jugador || 'Alguien';
      const eventCardData = cardService.getEventCardData(cardId);
      
      gameState.setEventCardInPlay({
        imageName: eventCardData.url,
        message: `${playerName} jugó una carta de evento!` 
      });

      switch (cardId) {
        case CARD_IDS.CARDS_OFF_THE_TABLE: {
          const targetPlayerId = payload;
          await apiService.playCardsOffTheTable(gameId, currentPlayerId, targetPlayerId, cardId);
          break;
        }
        case CARD_IDS.ANOTHER_VICTIM: { 
          const targetSet = payload;
          console.log('another victim data: ',cardId, targetSet);
          await apiService.playAnotherVictim(gameId, currentPlayerId, cardId, targetSet);
          break;
         }
        default:
          throw new Error(`Lógica de confirmación no implementada para la carta ${cardId}`);
      }

      // Lógica común de limpieza post-jugada exitosa
      setHand(prev => prev.filter(card => card.instanceId !== instanceId));
      setSelectedCards([]);
      setHasPlayedSetThisTurn(true);
      setPlayerTurnState('discarding');

    } catch (error) {
      console.error(`Error al jugar el evento ${eventCardToPlay.id}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      // Siempre cerramos todos los modales y reseteamos el estado del evento
      setPlayerSelectionModalOpen(false);
      setSetSelectionModalOpen(false);
      setEventCardToPlay(null);
    }
  };

  const handlePlay = useCallback(async () => {
    if (!isMyTurn || playerTurnState !== 'discarding') return;

    const isEvent = isValidEventCard(hand, selectedCards);
    const isSet = isValidDetectiveSet(hand, selectedCards);

    if (!isEvent && !isSet) return;

    const cardIdsToPlay = selectedCards
      .map((instanceId) => hand.find((c) => c.instanceId === instanceId)?.id)
      .filter((id) => id !== undefined);

    try {
      if (isEvent) {
        await handleEventPlay(cardIdsToPlay[0]);
      } else {
        await handleSetPlay(cardIdsToPlay);
      }
    } catch (error) {
      console.error('Error al iniciar el juego de una carta:', error);
    }
  }, [isMyTurn, playerTurnState, hand, selectedCards, gameId, currentPlayerId]);

  const handleSetPlay = async (cardIdsToPlay) => {
    try {
      if (apiService.playDetectiveSet) {
        await apiService.playDetectiveSet(gameId, currentPlayerId, cardIdsToPlay);
      }
      setHand(prev => prev.filter(card => !selectedCards.includes(card.instanceId)));
      setSelectedCards([]);
      setHasPlayedSetThisTurn(true);
      setPlayerTurnState('discarding');
    } catch (error) {
      console.error('Error al jugar set de detectives:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleEventPlay = async (cardId) => {
    switch (cardId) {
      case CARD_IDS.CARDS_OFF_THE_TABLE: {
        const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
        setEventCardToPlay({ id: cardInstance.id, instanceId: cardInstance.instanceId });
        setPlayerSelectionModalOpen(true);
        break;
      }
      case CARD_IDS.ANOTHER_VICTIM:
        const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
        setEventCardToPlay({ id: cardInstance.id, instanceId: cardInstance.instanceId });
        setSetSelectionModalOpen(true); 
        break;
      default:
        console.warn("Evento de carta no implementado:", cardId);
    }
  };

  return {
    handleCardClick,
    handleDraftCardClick,
    handleDiscard,
    handlePickUp,
    handlePlay,
    handleEventActionConfirm,
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
        if (secret.bocaArriba) {
          const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
          console.log(cardDetails)
          return { 
            ...secret, 
            url: cardDetails.url,
            nombre: cardDetails.nombre || secret.nombre 
          };
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