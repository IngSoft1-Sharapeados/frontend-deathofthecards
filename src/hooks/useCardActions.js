import { useCallback } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';
import { isValidEventCard } from '@/utils/eventCardValidation';

const CARD_IDS = {
  NOT_SO_FAST: 16,
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

const useCardActions = (gameId, gameState, onSetEffectTrigger) => {
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
    isLocalPlayerDisgraced,
    accionEnProgreso,
    setAccionPendiente
  } = gameState;

  const handlePlayNotSoFast = useCallback(async (card) => {
    try {
      await apiService.playNotSoFast(gameId, currentPlayerId, card.id);
    } catch (error) {
      console.error("Error al jugar Not So Fast:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId]);


  const handleCardClick = useCallback((instanceId) => {
    const card = hand.find(c => c.instanceId === instanceId);
    if (!card) return;

    const isNSF = card.id === CARD_IDS.NOT_SO_FAST;

    if (accionEnProgreso && isNSF) {
      handlePlayNotSoFast(card);
      return; // Fin de la acción
    }

    // Lógica original de selección de cartas
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
  }, [
    isMyTurn, playerTurnState, isLocalPlayerDisgraced,
    setSelectedCards, accionEnProgreso, hand, handlePlayNotSoFast
  ]);


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
      const cardToDiscard = hand.find(c => c.instanceId === selectedCards[0]);
      const isEarlyTrainDiscard = selectedCards.length === 1 && cardToDiscard?.id === CARD_IDS.EARLY_TRAIN;

      if (isEarlyTrainDiscard) {
        await apiService.playEarlyTrainToPaddington(gameId, currentPlayerId, cardToDiscard.id);


      } else {
        const cardIdsToDiscard = selectedCards
          .map(instanceId => hand.find(c => c.instanceId === instanceId)?.id)
          .filter(id => id !== undefined);
        await apiService.discardCards(gameId, currentPlayerId, cardIdsToDiscard);
      }

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

  const handleEventActionConfirm = async (payload, directCard = null) => {
    const cardToPlay = directCard || eventCardToPlay;
    if (!cardToPlay) return;

    const { id: cardId, instanceId } = cardToPlay;

    // --- 1. FLUJO NO-CANCELABLE (Cards off the table) ---
    // Esta carta se juega directamente y no usa la pila de acciones.
    if (cardId === CARD_IDS.CARDS_OFF_THE_TABLE) {
      try {
        const targetPlayerId = payload; // El payload es solo el ID del jugador
        await apiService.playCardsOffTheTable(gameId, currentPlayerId, targetPlayerId, cardId);

        // Limpieza de UI estándar
        setHand(prev => prev.filter(card => card.instanceId !== instanceId));
        setSelectedCards([]);
        setHasPlayedSetThisTurn(true);
        setPlayerTurnState('discarding');
      } catch (error) {
        console.error(`Error al jugar Cards off the table:`, error);
        alert(`Error: ${error.message}`);
      } finally {
        // Limpieza de Modales
        setPlayerSelectionModalOpen(false);
        setEventCardToPlay(null);
      }
      return; // Termina la función
    }

    // --- 2. FLUJO MULTI-PASO (One More) ---
    // Este flujo debe completarse ANTES de iniciar la acción en la pila.
    if (cardId === CARD_IDS.ONE_MORE) {
      try {
        if (oneMoreStep === 1) { // 
          // Step 1: Se seleccionó el jugador fuente, abrir modal de secretos
          const sourcePlayerId = payload;
          setOneMoreSourcePlayer(sourcePlayerId);
          setPlayerSelectionModalOpen(false);

          const sourcePlayer = players.find(p => p.id_jugador === sourcePlayerId);
          setViewingSecretsOfPlayer(sourcePlayer);
          setIsSecretsModalOpen(true);
          setIsSecretsLoading(true);

          try {
            const secretsFromApi = await apiService.getPlayerSecrets(gameId, sourcePlayerId);
            const processedSecrets = secretsFromApi
              .filter(s => s.bocaArriba) // Solo mostrar revelados
              .map(secret => {
                if (secret.carta_id) {
                  const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
                  return { ...secret, url: cardDetails.url, nombre: cardDetails.nombre || secret.nombre };
                }
                return secret;
              });
            setPlayerSecretsData(processedSecrets);
            setOneMoreStep(2); // Avanzar al siguiente paso
          } catch (error) {
            console.error("Error al obtener secretos:", error);
            setPlayerSecretsData([]);
            throw error;
          } finally {
            setIsSecretsLoading(false);
          }
          return; // Esperar al siguiente paso

        } else if (oneMoreStep === 2) {
          // Step 2: Se seleccionó el secreto, abrir modal de jugador destino
          const secretId = payload;
          setOneMoreSelectedSecret(secretId);
          setIsSecretsModalOpen(false);
          setPlayerSelectionModalOpen(true);
          setOneMoreStep(3); // Avanzar al siguiente paso
          setSelectedSecretCard(null);
          return; // Esperar al siguiente paso

        } else if (oneMoreStep === 3) {
          // Step 3: Se seleccionó el destino. ¡Payload completo!
          const destinationPlayerId = payload;
          setOneMoreDestinationPlayer(destinationPlayerId);

          const actualSecretId = oneMoreSelectedSecret;
          if (!actualSecretId) {
            throw new Error('No se seleccionó un secreto válido');
          }

          // ¡AQUÍ ESTÁ LA INTERCEPCIÓN!
          // En lugar de llamar a apiService.playOneMore, llamamos a iniciarAccion.
          const fullOneMorePayload = {
            id_fuente: oneMoreSourcePlayer,
            id_destino: destinationPlayerId,
            id_unico_secreto: actualSecretId
          };

          // 1. Guardar acción localmente para ejecutarla después
          setAccionPendiente({
            tipo_accion: "evento_one_more",
            payload_original: fullOneMorePayload,
            id_carta_jugada: cardId
          });

          // 2. Llamar al NUEVO endpoint /iniciar-accion
          await apiService.iniciarAccion(gameId, currentPlayerId, {
            tipo_accion: "evento_one_more",
            id_carta_jugada: cardId,
            payload_original: fullOneMorePayload
          });

          // 3. Limpieza de UI (copiada del original)
          setOneMoreStep(0);
          setOneMoreSourcePlayer(null);
          setOneMoreSelectedSecret(null);
          setOneMoreDestinationPlayer(null);
          setPlayerSelectionModalOpen(false);
          setEventCardToPlay(null);
          setSelectedSecretCard(null);
          // (No quitamos la carta de la mano, eso lo decide el resolver)
          return; // Fin del flujo One More
        }
      } catch (error) {
        // ... (Tu manejo de error de One More)
        console.error(`Error en flujo OneMore:`, error);
        alert(`Error jugando OneMore: ${error.message || 'Error desconocido'}`);
        // Resetear todo en caso de error
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
    } // --- FIN DEL FLUJO 'ONE MORE' ---


    // --- 3. FLUJO CANCELABLE (Eventos Simples) ---
    // Todas las demás cartas de evento que llegan aquí son cancelables
    // y usan el flujo genérico de /iniciar-accion.

    try {
      let tipo_accion = "";
      let payload_original = {};

      switch (cardId) {
        case CARD_IDS.ANOTHER_VICTIM: {
          const targetSet = payload;
          tipo_accion = "evento_another_victim";
          payload_original = {
            id_objetivo: targetSet.jugador_id,
            id_representacion_carta: targetSet.representacion_id_carta,
            ids_cartas: targetSet.cartas_ids
          };
          break;
        }

        case CARD_IDS.EARLY_TRAIN: {
          tipo_accion = "evento_early_train";
          payload_original = null; // No necesita payload
          break;
        }

        case CARD_IDS.DELAY_ESCAPE: {
          tipo_accion = "evento_delay_escape";
          payload_original = { cantidad: payload }; // payload es solo un número
          break;
        }

        case CARD_IDS.LOOK_ASHES: {
          // Como se discutió, este flujo es de 2 pasos y no es
          // manejado por esta función. Se maneja en handleLookIntoAshesConfirm.
          // Para evitar un error, lo jugamos directo (no cancelable).
          console.warn("Look Into The Ashes no es cancelable en este flujo.");
          await handleLookIntoAshesConfirm(); // Llama a la lógica original
          return; // Salir de la función
        }

        default:
          throw new Error(`Lógica de "iniciar-accion" no implementada para la carta ${cardId}`);
      }

      // --- Lógica Común para Eventos Simples ---

      // 1. Guardar acción localmente
      setAccionPendiente({
        tipo_accion,
        payload_original,
        id_carta_jugada: cardId
      });

      // 2. Llamar al NUEVO endpoint /iniciar-accion
      await apiService.iniciarAccion(gameId, currentPlayerId, {
        tipo_accion: tipo_accion,
        id_carta_jugada: cardId,
        payload_original: payload_original
      });

      // 3. Limpieza de UI
      // (NO quitamos la carta de la mano, eso lo decide el resolver)
      setSelectedCards([]);

    } catch (error) {
      console.error(`Error al iniciar el evento ${cardToPlay.id}:`, error);
      alert(`Error: ${error.message}`);
      setAccionPendiente(null); // Limpiar si la iniciación falla
    } finally {
      // Cerrar todos los modales
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
      const payload_original = { set_cartas: cardIdsToPlay };
      const tipo_accion = "jugar_set_detective";

      // 1. Guardar localmente
      setAccionPendiente({
        tipo_accion,
        payload_original,
        id_carta_jugada: cardIdsToPlay[0]
      });

      // 2. Llamar al NUEVO endpoint /iniciar-accion
      await apiService.iniciarAccion(gameId, currentPlayerId, {
        tipo_accion: tipo_accion,
        cartas_db_ids: cardIdsToPlay,
        nombre_accion: "Set de Detectives",
        payload_original: payload_original
      });

      setSelectedCards([]);

    } catch (error) {
      console.error('Error al iniciar "Jugar Set":', error);
      alert(`Error: ${error.message}`);
      setAccionPendiente(null); // Limpiar si falla
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
      case CARD_IDS.EARLY_TRAIN: {
        await handleEventActionConfirm(null, cardInstance);
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