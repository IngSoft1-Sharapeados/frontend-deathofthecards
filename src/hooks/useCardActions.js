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
    hasPlayedSetThisTurn, setHasPlayedSetThisTurn, setConfirmationModalOpen,
    setPlayerSelectionModalOpen, setEventCardToPlay, eventCardToPlay, setSetSelectionModalOpen,
    setLookIntoAshesModalOpen, setDiscardPileSelection, setSelectedDiscardCard,
    // OneMore states
    oneMoreStep, setOneMoreStep,
    oneMoreSourcePlayer, setOneMoreSourcePlayer,
    oneMoreSelectedSecret, setOneMoreSelectedSecret,
    oneMoreDestinationPlayer, setOneMoreDestinationPlayer,
    setIsSecretsModalOpen, setViewingSecretsOfPlayer, setPlayerSecretsData, setIsSecretsLoading,
    setSelectedSecretCard,
    isLocalPlayerDisgraced
  } = gameState;

  const handleCardClick = useCallback((instanceId) => {
    if (!isMyTurn || playerTurnState !== 'discarding') return;
    setSelectedCards((prev) => {
      if (prev.includes(instanceId)) {
        return prev.filter((id) => id !== instanceId);
      }
      if (isLocalPlayerDisgraced && prev.length >= 1) {
        return prev;
      }
      return [...prev, instanceId];
    });
  }, [isMyTurn, playerTurnState, isLocalPlayerDisgraced, setSelectedCards]);

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

    const { id: cardId, instanceId } = eventCardToPlay;
    
    // Special handling for OneMore event flow
    if (cardId === CARD_IDS.ONE_MORE) {
      try {
        if (oneMoreStep === 1) {
          // Step 1: Source player selected, now show secrets modal
          const sourcePlayerId = payload;
          setOneMoreSourcePlayer(sourcePlayerId);
          setPlayerSelectionModalOpen(false);
          
          // Open secrets modal for the source player
          const sourcePlayer = players.find(p => p.id_jugador === sourcePlayerId);
          setViewingSecretsOfPlayer(sourcePlayer);
          setIsSecretsModalOpen(true);
          setIsSecretsLoading(true);
          
          try {
            const secretsFromApi = await apiService.getPlayerSecrets(gameId, sourcePlayerId);
            const processedSecrets = secretsFromApi
              .filter(s => s.bocaArriba) // Only show revealed secrets
              .map(secret => {
                if (secret.carta_id) {
                  const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
                  return { 
                    ...secret, 
                    url: cardDetails.url,
                    nombre: cardDetails.nombre || secret.nombre 
                  };
                }
                return secret;
              });
            setPlayerSecretsData(processedSecrets);
            setOneMoreStep(2);
          } catch (error) {
            console.error("Error al obtener secretos:", error);
            setPlayerSecretsData([]);
            throw error;
          } finally {
            setIsSecretsLoading(false);
          }
          return; // Don't finish the event yet
        } else if (oneMoreStep === 2) {
          // Step 2: Secret selected, now show player selection for destination
          const secretId = payload;
          setOneMoreSelectedSecret(secretId);
          setIsSecretsModalOpen(false);
          setPlayerSelectionModalOpen(true);
          setOneMoreStep(3);
          setSelectedSecretCard(null); // Clear selection for next modal
          return; // Don't finish the event yet
        } else if (oneMoreStep === 3) {
          // Step 3: Destination player selected, execute the event
          const destinationPlayerId = payload;
          setOneMoreDestinationPlayer(destinationPlayerId);
          
          const playerName = players.find(p => p.id_jugador === currentPlayerId)?.nombre_jugador || 'Alguien';
          const eventCardData = cardService.getEventCardData(cardId);
          
          gameState.setEventCardInPlay({
            imageName: eventCardData.url,
            message: `${playerName} jugó una carta de evento!` 
          });
          
          // Get the actual selected secret value (state might not be updated yet)
          const actualSecretId = oneMoreSelectedSecret;
          
          if (!actualSecretId) {
            throw new Error('No se seleccionó un secreto válido');
          }
          
          await apiService.playOneMore(gameId, currentPlayerId, cardId, {
            id_fuente: oneMoreSourcePlayer,
            id_destino: destinationPlayerId,
            id_unico_secreto: actualSecretId
          });
          
          // Reset OneMore state and clean up
          setOneMoreStep(0);
          setOneMoreSourcePlayer(null);
          setOneMoreSelectedSecret(null);
          setOneMoreDestinationPlayer(null);
          setPlayerSelectionModalOpen(false);
          setEventCardToPlay(null);
          setSelectedSecretCard(null);
          
          // Remove card from hand
          setHand(prev => prev.filter(card => card.instanceId !== instanceId));
          setSelectedCards([]);
          setHasPlayedSetThisTurn(true);
          setPlayerTurnState('discarding');
          return;
        }
      } catch (error) {
        console.error(`Error en flujo OneMore:`, error);
        // Better error message handling
        let errorMessage = 'Error desconocido';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.detail) {
          errorMessage = error.detail;
        }
        alert(`Error jugando OneMore: ${errorMessage}`);
        // Reset everything on error
        setOneMoreStep(0);
        setOneMoreSourcePlayer(null);
        setOneMoreSelectedSecret(null);
        setOneMoreDestinationPlayer(null);
        setIsSecretsModalOpen(false);
        setPlayerSelectionModalOpen(false);
        setEventCardToPlay(null);
        setSelectedSecretCard(null);
        return;
      }
    }

    // Handle other event cards
    try {
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
          console.log('another victim data: ', cardId, targetSet);
          await apiService.playAnotherVictim(gameId, currentPlayerId, cardId, targetSet);
          break;
         }
        case CARD_IDS.LOOK_ASHES: {
          // Este caso ahora se maneja en handleLookIntoAshesConfirm
          await handleLookIntoAshesConfirm();
          break; 
        }
        case CARD_IDS.DELAY_ESCAPE: {
          const amountToGet = payload;
          console.log("toget: ", payload);

          await apiService.playDelayTheMurdererEscape(gameId, currentPlayerId, cardId, amountToGet);
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
      // Close modals for other events
      setPlayerSelectionModalOpen(false);
      setConfirmationModalOpen(false);
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

  const handleLookIntoTheAshes = async () => {
    try {
      const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
      
      // Primera llamada - jugar la carta sin objetivo
      await apiService.playLookIntoTheAshes(gameId, currentPlayerId, cardInstance.id);
      
      // Obtener 5 cartas del descarte
      const discardCards = await apiService.getDiscardPile(gameId, currentPlayerId, 5);
      
      // Procesar las cartas para mostrar en el modal
      const processedDiscardCards = discardCards.map((card, index) => {
        const cardDetails = cardService.getPlayingHand([card])[0];
        return {
          ...cardDetails,
          instanceId: `discard-selection-${card.id}-${index}`,
          originalId: card.id // Guardar el ID original para la segunda llamada
        };
      });
         // Preparar estado para el modal
      setEventCardToPlay({ 
        id: cardInstance.id, 
        instanceId: cardInstance.instanceId 
      });
      setDiscardPileSelection(processedDiscardCards);
      setSelectedDiscardCard(null);
      setLookIntoAshesModalOpen(true);
      
    } catch (error) {
      console.error("Error al iniciar Look Into The Ashes:", error);
      alert(`Error: ${error.message}`);
      // Limpiar estado en caso de error
      setEventCardToPlay(null);
      setSelectedCards([]);
    }
  };

  const handleLookIntoAshesConfirm = async () => {

    if (!gameState.selectedDiscardCard || !eventCardToPlay) return;
    
    try {
      const selectedCard = gameState.discardPileSelection.find(
        card => card.instanceId === gameState.selectedDiscardCard
      );
      
      if (!selectedCard) return;
      
      // Segunda llamada - con la carta objetivo seleccionada
      await apiService.playLookIntoTheAshes(
        gameId,
        currentPlayerId,
        null, // id_carta debe ser null en la segunda llamada
        selectedCard.originalId // id_carta_objetivo
      );

          //ACTUALIZAR LA MANO 
      try {
        const freshHandData = await apiService.getHand(gameId, currentPlayerId);
        const playingHand = cardService.getPlayingHand(freshHandData);
        const handWithInstanceIds = playingHand.map((card, index) => ({
          ...card,
          instanceId: `${card.id}-sync-${Date.now()}-${index}`,
        }));
        setHand(handWithInstanceIds);
      } catch (e) {
        console.warn('No se pudo sincronizar la mano después de Look Into The Ashes:', e);
        // Fallback: eliminar solo la carta de evento jugada
        setHand(prev => prev.filter(card => card.instanceId !== eventCardToPlay.instanceId));
      }

      // Limpiar estado completamente
      setSelectedCards([]);
      setHasPlayedSetThisTurn(true);
      setPlayerTurnState('discarding');
      
    } catch (error) {
      console.error("Error al confirmar Look Into The Ashes:", error);
      alert(`Error al seleccionar carta: ${error.message}`);
    } finally {
      // Siempre limpiar los estados del modal
      gameState.setLookIntoAshesModalOpen(false);
      gameState.setDiscardPileSelection([]);
      gameState.setSelectedDiscardCard(null);
      setEventCardToPlay(null);
    }
  };





  const handleEventPlay = async (cardId) => {
    const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
    if (!cardInstance) return; // Salir si no se encuentra la carta

    setEventCardToPlay({ id: cardInstance.id, instanceId: cardInstance.instanceId });

    switch (cardId) {
      case CARD_IDS.CARDS_OFF_THE_TABLE: {
        setPlayerSelectionModalOpen(true);
        break;
      }
      case CARD_IDS.ANOTHER_VICTIM: {
        setSetSelectionModalOpen(true);
        break;
      }
      case CARD_IDS.DELAY_ESCAPE: {
        setConfirmationModalOpen(true);
        break;
      }
      case CARD_IDS.ONE_MORE: {
        const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
        setEventCardToPlay({ id: cardInstance.id, instanceId: cardInstance.instanceId });
        // Check eligible source players (with at least one revealed secret)
        const eligibleSources = players.filter(p => (gameState.playersSecrets[p.id_jugador]?.revealed ?? 0) > 0);
        if (eligibleSources.length === 0) {
          alert('Ningún jugador tiene secretos revelados para robar.');
          // Do not start OneMore flow; keep normal turn flow
          setEventCardToPlay(null);
          return;
        }
        setOneMoreStep(1); // Start OneMore flow
        setPlayerSelectionModalOpen(true);
        break;
      }
      case CARD_IDS.LOOK_ASHES: {
        await handleLookIntoTheAshes();
        break;
      }
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
    handleEventActionConfirm,
    handleLookIntoAshesConfirm,
    handleOneMoreSecretSelect: (secretId) => {
      if (oneMoreStep === 2) {
        handleEventActionConfirm(secretId);
      }
    }
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