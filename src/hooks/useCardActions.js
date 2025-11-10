import { useCallback } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';
import { isValidEventCard } from '@/utils/eventCardValidation';

const CARD_IDS = {
  COMODIN_ID: 14,
  ARIADNE_OLIVER: 15,
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

const useCardActions = (gameId, gameState, onSetEffectTrigger, iniciarAccionCancelable) => {
  const {
    hand, setHand, selectedDraftCards, draftCards,
    selectedCards, setSelectedCards,
    currentPlayerId,
    isMyTurn, players,
    playerTurnState, setPlayerTurnState, setSelectedDraftCards,
    hasPlayedSetThisTurn, setHasPlayedSetThisTurn, setConfirmationModalOpen,
    setPlayerSelectionModalOpen, setEventCardToPlay, eventCardToPlay, setSetSelectionModalOpen,
    setLookIntoAshesModalOpen, setDiscardPileSelection, setSelectedDiscardCard,
    selectedDiscardCard, discardPileSelection,
    // OneMore states
    oneMoreStep, setOneMoreStep,
    oneMoreSourcePlayer, setOneMoreSourcePlayer,
    oneMoreSelectedSecret, setOneMoreSelectedSecret,
    oneMoreDestinationPlayer, setOneMoreDestinationPlayer,
    setIsSecretsModalOpen, setViewingSecretsOfPlayer, setPlayerSecretsData, setIsSecretsLoading,
    setSelectedSecretCard,
    isLocalPlayerDisgraced,
    accionEnProgreso,
  } = gameState;

  const handlePlayNotSoFast = useCallback(async (card) => {
    try {
      if (!card.id_instancia) {
        console.error("Error: 'Not So Fast' no tiene id_instancia.", card);
        alert("Error al jugar Not So Fast: No se encontró el ID de la carta.");
        return;
      }
      setHand(prevHand => prevHand.filter(c => c.instanceId !== card.instanceId));
      await apiService.playNotSoFast(gameId, currentPlayerId, card.id);
    } catch (error) {
      console.error("Error al jugar Not So Fast:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId]);


  const handleCardClick = useCallback((instanceId) => {
    console.log(`[useCardActions] handleCardClick buscando: ${instanceId}`);
    const card = hand.find(c => c.instanceId === instanceId);
    console.log('[useCardActions] ¡¡¡CARTA ENCONTRADA!!!:', card);
    if (!card) return;
    const isNSF = card.id === CARD_IDS.NOT_SO_FAST;
    if (accionEnProgreso && isNSF) {
      handlePlayNotSoFast(card);
      return;
    }
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
    // ... (sin cambios)
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
    // ... (sin cambios, tu lógica de Early Train es correcta)
    if (selectedCards.length === 0 || !isMyTurn) return;
    try {
      const cardToDiscard = hand.find(c => c.instanceId === selectedCards[0]);
      const isEarlyTrainDiscard = selectedCards.length === 1 && cardToDiscard?.id === CARD_IDS.EARLY_TRAIN;

      if (isEarlyTrainDiscard) {
        if (!cardToDiscard.id_instancia) throw new Error("Early Train no tiene id_instancia");
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

      setSelectedDraftCards([]);

      try {
        const freshHandData = await apiService.getHand(gameId, currentPlayerId);
        const playingHand = cardService.getPlayingHand(freshHandData);
        const handWithInstanceIds = playingHand.map((card, index) => ({
          ...card,
          instanceId: `card-inst-${card.id_instancia}`
        }));

        console.log("[handlePickUp] Mano resincronizada:", handWithInstanceIds);
        setHand(handWithInstanceIds);
        setPlayerTurnState('discarding');
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

    const { id: cardId, instanceId, id_instancia } = cardToPlay;
    const cardNombre = cardService.getCardNameById(cardId);

    // ---  FLUJO NO-CANCELABLE (Cards off the table) ---
    if (cardId === CARD_IDS.CARDS_OFF_THE_TABLE) {
      try {
        const targetPlayerId = payload;
        await apiService.playCardsOffTheTable(gameId, currentPlayerId, targetPlayerId, cardId);
        const newHand = hand.filter(card => card.instanceId !== instanceId);
        setHand(newHand);

        setSelectedCards([]);
        setHasPlayedSetThisTurn(true);

        setPlayerTurnState('discarding');
      } catch (error) {
        console.error(`Error al jugar Cards off the table:`, error);
        alert(`Error: ${error.message}`);
      } finally {
        setPlayerSelectionModalOpen(false);
        setEventCardToPlay(null);
      }
      return;
    }

    // --- FLUJO NO-CANCELABLE (Look Into The Ashes) ---
    if (cardId === CARD_IDS.LOOK_ASHES) {
      console.warn("Llamada inesperada a LOOK_ASHES en handleEventActionConfirm");
      return;
    }

    // --- 2. FLUJO MULTI-PASO (One More) ---
    if (cardId === CARD_IDS.ONE_MORE) {
      try {
        if (oneMoreStep === 1) {
          // ... (sin cambios)
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
              .filter(s => s.bocaArriba)
              .map(secret => {
                if (secret.carta_id) {
                  const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
                  return { ...secret, url: cardDetails.url, nombre: cardDetails.nombre || secret.nombre };
                }
                return secret;
              });
            setPlayerSecretsData(processedSecrets);
            setOneMoreStep(2);
          } catch (error) {
            // ... (manejo de error)
          } finally {
            setIsSecretsLoading(false);
          }
          return;

        } else if (oneMoreStep === 2) {
          // ... (sin cambios)
          const secretId = payload;
          setOneMoreSelectedSecret(secretId);
          setIsSecretsModalOpen(false);
          setPlayerSelectionModalOpen(true);
          setOneMoreStep(3);
          setSelectedSecretCard(null);
          return;

        } else if (oneMoreStep === 3) {
          // ... (sin cambios, esto es cancelable y está bien)
          const destinationPlayerId = payload;
          setOneMoreDestinationPlayer(destinationPlayerId);
          const actualSecretId = oneMoreSelectedSecret;
          if (!actualSecretId) {
            throw new Error('No se seleccionó un secreto válido');
          }
          const fullOneMorePayload = {
            id_fuente: oneMoreSourcePlayer,
            id_destino: destinationPlayerId,
            id_unico_secreto: oneMoreSelectedSecret
          };
          await iniciarAccionCancelable({
            tipo_accion: "evento_one_more",
            cartas_db_ids: [id_instancia],
            nombre_accion: cardNombre,
            payload_original: fullOneMorePayload,
            id_carta_tipo_original: cardId
          });
          // ... (limpieza de UI)
          setOneMoreStep(0);
          setOneMoreSourcePlayer(null);
          setOneMoreSelectedSecret(null);
          setOneMoreDestinationPlayer(null);
          setPlayerSelectionModalOpen(false);
          setEventCardToPlay(null);
          setSelectedSecretCard(null);
          setHand(prevHand => prevHand.filter(card => card.instanceId !== instanceId));
          return;
        }

      } catch (error) {
        // ... (manejo de error)
      }
    }


    // ---  FLUJO CANCELABLE (Eventos Simples) ---
    try {
      const playerName = players.find(p => p.id_jugador === currentPlayerId)?.nombre_jugador || 'Alguien';
      // Mostrar display del evento
      {
        let imageName;
        if (cardId === CARD_IDS.ARIADNE_OLIVER) {
          imageName = cardService.getCardImageUrl(cardId);
        } else {
          const eventCardData = cardService.getEventCardData?.(cardId);
          imageName = eventCardData?.url ?? cardService.getCardImageUrl(cardId);
        }
        if (typeof gameState.setEventCardInPlay === 'function') {
          gameState.setEventCardInPlay({
            imageName,
            message: cardId === CARD_IDS.ARIADNE_OLIVER ? `${playerName} jugó "Ariadne Oliver"` : `${playerName} jugó una carta de evento!`
          });
        }
      }

      let tipo_accion = "";
      let payload_original = {};

      switch (cardId) {
        case CARD_IDS.ARIADNE_OLIVER: {
          const targetSet = payload; // { jugador_id, representacion_id_carta, cartas_ids }
          tipo_accion = 'evento_ariadne_oliver';
          payload_original = {
            id_objetivo: targetSet.jugador_id,
            id_representacion_carta: targetSet.representacion_id_carta
          };
          break;
        }
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
          payload_original = null;
          break;
        }
        case CARD_IDS.DELAY_ESCAPE: {
          tipo_accion = "evento_delay_escape";
          payload_original = { cantidad: payload };
          break;
        }
        case CARD_IDS.POINT_SUSPICIONS: {
          tipo_accion = "evento_point_your_suspicions";
          payload_original = null; // No hay payload en el paso 1
          break;
        }
        case CARD_IDS.CARDS_OFF_THE_TABLE: {
          // Mantener Cards Off The Table como no-cancelable
          const targetPlayerId = payload;
          await apiService.playCardsOffTheTable(gameId, currentPlayerId, targetPlayerId, cardId);
          // Limpieza de UI similar
          setSelectedCards([]);
          const newHandCot = hand.filter(card => card.instanceId !== cardToPlay.instanceId);
          setHand(newHandCot);
          setHasPlayedSetThisTurn(true);
          setPlayerTurnState(() => (newHandCot.length < 6 ? 'drawing' : 'discarding'));
          return;
        }
        default:
          throw new Error(`Lógica de "iniciar-accion" no implementada para la carta ${cardId}`);
      }

      // 1. Llamar a iniciarAccionCancelable (sin 'setAccionPendiente')
      await iniciarAccionCancelable({
        tipo_accion: tipo_accion,
        cartas_db_ids: [id_instancia], // ID de BBDD
        nombre_accion: cardNombre,
        payload_original: payload_original,
        id_carta_tipo_original: cardId
      });

      // 2. Limpieza de UI
      setSelectedCards([]);

      const newHand = hand.filter(card => card.instanceId !== cardToPlay.instanceId);
      setHand(newHand);

      setHasPlayedSetThisTurn(true);

      setPlayerTurnState(() => {
        const remainingCards = newHand.length;
        return remainingCards < 6 ? 'drawing' : 'discarding';
      });

    } catch (error) {
      console.error(`Error al iniciar el evento ${cardToPlay.id}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      // Cerrar todos los modales
      setPlayerSelectionModalOpen(false);
      setConfirmationModalOpen(false);
      setSetSelectionModalOpen(false);
      setEventCardToPlay(null);
    }
  };

  const handlePlay = useCallback(async () => {
    // ... (sin cambios)
    if (!isMyTurn || playerTurnState !== 'discarding') return;
    const isEvent = isValidEventCard(hand, selectedCards);
    const isSet = isValidDetectiveSet(hand, selectedCards);
    const isAriadne = (() => {
      if (selectedCards.length !== 1) return false;
      const card = hand.find(c => c.instanceId === selectedCards[0]);
      return card?.id === CARD_IDS.ARIADNE_OLIVER;
    })();

    if (!isEvent && !isSet && !isAriadne) return;
    const cardIdsToPlay = selectedCards
      .map((instanceId) => hand.find((c) => c.instanceId === instanceId)?.id)
      .filter((id) => id !== undefined);
    try {
      if (isEvent) {
        await handleEventPlay(cardIdsToPlay[0]);
      } else if (isAriadne) {
        // Reutilizar SetSelectionModal como con Another Victim
        const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
        if (!cardInstance) return;
        setEventCardToPlay({ id: cardInstance.id, instanceId: cardInstance.instanceId, id_instancia: cardInstance.id_instancia });
        setSetSelectionModalOpen(true);
      } else {
        await handleSetPlay(cardIdsToPlay);
      }
    } catch (error) {
      console.error('Error al iniciar el juego de una carta:', error);
    }
  }, [isMyTurn, playerTurnState, hand, selectedCards, gameId, currentPlayerId]);


  const handleSetPlay = async (cardIdsToPlay) => {
    try {
      const cartas_db_ids = selectedCards.map(instanceId => {
        return hand.find(c => c.instanceId === instanceId)?.id_instancia;
      }).filter(Boolean);
      if (cartas_db_ids.length !== cardIdsToPlay.length) {
        throw new Error("No se pudieron encontrar los IDs de BBDD de las cartas seleccionadas.");
      }
      const payload_original = { set_cartas: cardIdsToPlay };
      const tipo_accion = "jugar_set_detective";

      const idParaMostrar = cardIdsToPlay.find(id => id !== CARD_IDS.COMODIN_ID);

      const cardsToRemoveFromHand = [...selectedCards];

      // Detectar si es el set de los Hermanos Beresford juntos (Tommy=12 + Tuppence=13).
      const isBeresforderBrothersPair = 
        cardIdsToPlay.length === 2 && 
        cardIdsToPlay.includes(12) && 
        cardIdsToPlay.includes(13);

      if (isBeresforderBrothersPair) {
        // Ejecutar directamente.
        await apiService.playDetectiveSet(gameId, currentPlayerId, cardIdsToPlay);
      } else {
        // Flujo normal: acción cancelable.
        await iniciarAccionCancelable({
          tipo_accion,
          cartas_db_ids,
          nombre_accion: "Set de Detectives",
          payload_original,
          id_carta_tipo_original: idParaMostrar || cardIdsToPlay[0]
        });
      }

      setSelectedCards([]);
      setHand(prevHand =>
        prevHand.filter(card => !cardsToRemoveFromHand.includes(card.instanceId))
      );

      setHasPlayedSetThisTurn(true);
      setPlayerTurnState("discarding");
    } catch (error) {
      console.error('Error al iniciar "Jugar Set":', error);
      alert(`Error: ${error.message}`);
    }
  };


  // --- CORRECCIÓN CLAVE: Lógica de LITA movida aquí ---
  // Paso 2 de LITA: Confirmar la carta del descarte, hacer la LLAMADA 2
  const handleLookIntoTheAshesConfirm = async () => {
    if (!selectedDiscardCard || !eventCardToPlay) return;

    try {
      const selectedCard = discardPileSelection.find(
        card => card.instanceId === selectedDiscardCard
      );
      if (!selectedCard) throw new Error("Carta seleccionada no válida.");

      // --- LLAMADA 2 (NO CANCELABLE) ---
      // Llama al backend solo con id_carta_objetivo (de tipo)
      await apiService.playLookIntoTheAshes(
        gameId,
        currentPlayerId,
        null, // id_carta es null
        selectedCard.originalId // id_carta_objetivo es el ID de TIPO
      );

      // La acción está completa. Sincronizar la mano
      // (porque el backend nos dio la carta 'selectedCard')
      try {
        const freshHandData = await apiService.getHand(gameId, currentPlayerId);
        const playingHand = cardService.getPlayingHand(freshHandData);

        const handWithInstanceIds = playingHand.map((card) => ({
          ...card,
          instanceId: `card-inst-${card.id_instancia}`,
        }));
        setHand(handWithInstanceIds);
      } catch (e) {
        console.warn('No se pudo sincronizar la mano después de LITA (Paso 2):', e);
      }

    } catch (error) {
      console.error("Error al confirmar Look Into The Ashes (Paso 2):", error);
      alert(`Error al seleccionar carta: ${error.message}`);
    } finally {
      // Siempre limpiar los estados del modal
      setLookIntoAshesModalOpen(false);
      setDiscardPileSelection([]);
      setSelectedDiscardCard(null);
      setEventCardToPlay(null);
    }
  };


  // Paso 1 de LITA: Jugar la carta, hacer la LLAMADA 1 y abrir el modal
  const handleLookIntoTheAshes_START = async () => {
    try {
      const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
      if (!cardInstance || !cardInstance.id_instancia) {
        throw new Error("No se encontró la instancia de la carta 'Look Into The Ashes'");
      }

      // --- LLAMADA 1 (NO CANCELABLE) ---
      // Llama al backend solo con el id_carta (de instancia)
      await apiService.playLookIntoTheAshes(gameId, currentPlayerId, cardInstance.id, null);

      // Si la llamada 1 fue exitosa, obtener el descarte y abrir el modal
      const discardCards = await apiService.getDiscardPile(gameId, currentPlayerId, 5);
      const processedDiscardCards = discardCards.map((card, index) => {
        const cardDetails = cardService.getPlayingHand([card])[0];
        return {
          ...cardDetails,
          instanceId: `discard-selection-${card.id}-${index}`,
          originalId: card.id // ID de tipo
        };
      });

      // Guardar la carta que estamos jugando para el Paso 2
      setEventCardToPlay({
        id: cardInstance.id,
        instanceId: cardInstance.instanceId,
        id_instancia: cardInstance.id_instancia
      });
      setDiscardPileSelection(processedDiscardCards);
      setSelectedDiscardCard(null);
      setLookIntoAshesModalOpen(true);

      // A diferencia de las acciones cancelables, esta SÍ se quita de la mano
      // y se actualiza el estado, porque ya se "jugó" (Paso 1).
      // El backend la habrá movido, así que sincronizamos.
      setHand(prev => prev.filter(card => card.instanceId !== cardInstance.instanceId));
      setSelectedCards([]);
      setHasPlayedSetThisTurn(true);
      setPlayerTurnState('discarding');


    } catch (error) {
      console.error("Error al iniciar Look Into The Ashes (Paso 1):", error);
      alert(`Error: ${error.message}`);
      setEventCardToPlay(null);
      setSelectedCards([]);
    }
  };


  const handleEventPlay = async (cardId) => {
    const cardInstance = hand.find(c => c.instanceId === selectedCards[0]);
    if (!cardInstance) return;

    setEventCardToPlay({
      id: cardInstance.id,
      instanceId: cardInstance.instanceId,
      id_instancia: cardInstance.id_instancia
    });

    switch (cardId) {
      case CARD_IDS.CARDS_OFF_THE_TABLE: {
        setPlayerSelectionModalOpen(true);
        break;
      }
      // --- CORRECCIÓN ---
      // LITA se maneja con su propia función de PASO 1
      case CARD_IDS.LOOK_ASHES: {
        await handleLookIntoTheAshes_START(); // Llamar a la función de Paso 1
        break;
      }
      // --------------------
      case CARD_IDS.ANOTHER_VICTIM: {
        setSetSelectionModalOpen(true);
        break;
      }
      case CARD_IDS.ARIADNE_OLIVER: {
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
      case CARD_IDS.POINT_SUSPICIONS: {
        await handleEventActionConfirm(null, cardInstance);
        break;
      }

      case CARD_IDS.ONE_MORE: {
        const eligibleSources = players.filter(p => (gameState.playersSecrets[p.id_jugador]?.revealed ?? 0) > 0);
        if (eligibleSources.length === 0) {
          alert('Ningún jugador tiene secretos revelados para robar.');
          setEventCardToPlay(null);
          return;
        }
        setOneMoreStep(1);
        setPlayerSelectionModalOpen(true);
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
    handleLookIntoTheAshesConfirm, // Exponer la función de Paso 2
    handleOneMoreSecretSelect: (secretId) => {
      if (oneMoreStep === 2) {
        handleEventActionConfirm(secretId);
      }
    }
  };
};

// 'useSecrets' no necesita cambios
export const useSecrets = (gameId, gameState) => {
  // ... (código de useSecrets sin cambios)
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
      const processedSecrets = secretsFromApi.map(secret => {
        if (secret.bocaArriba && secret.carta_id) {
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

