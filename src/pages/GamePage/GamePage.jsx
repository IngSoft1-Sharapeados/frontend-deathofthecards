import { useParams, useNavigate } from 'react-router-dom';
import { cardService } from '@/services/cardService';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { apiService } from '@/services/apiService';


// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import PlayerPod from '@/components/PlayerPod/PlayerPod.jsx';
import CardDraft from '@/components/CardDraft/CardDraft.jsx'
import SecretsModal from '@/components/SecretsModal/SecretsModal.jsx';
import useDetectiveSecretReveal from '@/hooks/useDetectiveSecretReveal.jsx';
import MySetsCarousel from '@/components/MySetsCarousel/MySetsCarousel.jsx';
import MySecretsCarousel from '@/components/MySecretsCarousel/MySecretsCarousel.jsx';
import SetSelectionModal from '@/components/EventModals/SetSelectionModal';
import DisgraceOverlay from '@/components/UI/DisgraceOverlay';
import ConfirmationModal from '@/components/EventModals/ConfirmationModal';
import LookIntoAshesModal from '@/components/EventModals/LookIntoAshesModal';
import DiscardDeck from '@/components/DiscardDeck/DiscardDeck.jsx';
import Chat from '@/components/Chat/Chat.jsx';
// Hooks
import useWebSocket from '@/hooks/useGameWebSockets';
import useGameState from '@/hooks/useGameState';
import useGameData from '@/hooks/useGameData';
import useCardActions, { useSecrets } from '@/hooks/useCardActions';
import { CARD_IDS } from '@/hooks/useCardActions';
import PlayerSelectionModal from '@/components/EventModals/PlayerSelectionModal';
import EventDisplay from '@/components/EventModals/EventDisplay';
import useSecretActions from '@/hooks/useSecretActions';
import ActionStackModal from '@/components/EventModals/ActionStackModal';
import ActionResultToast from '@/components/EventModals/ActionResultToast';
import CardTradeModal from '@/components/EventModals/CardTrade/CardTradeModal';
import useActionStack from '@/hooks/useActionStack';
import websocketService from '@/services/websocketService';
import useEventLog from '@/hooks/useEventLog';
import EventLogModal from '@/components/EventLog/EventLogModal';
import { useTurnTimer, TURN_DURATION } from '@/hooks/useTurnTimer'; 
import TurnTimer from '@/components/TurnTimer/TurnTimer';
import DeadCardFollyModal from '@/components/EventModals/DeadCardFolly/DeadCardFollyModal';

// Styles
import styles from './GamePage.module.css';

const NOT_SO_FAST_ID = 16;
const PYS_ID = 25;
const NOT_SO_FAST_WINDOW_MS = 5000;

const GamePage = () => {

  const { id: gameId } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  const gameState = useGameState();
  const { events, logTurnStart, logEventCardPlayed, logSetPlayed, logCardAddedToSet, logAriadneOliverPlayed, logGameStart } = useEventLog();
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const {
    hand, selectedCards, isLoading,
    deckCount, currentTurn, /* turnOrder */ players,
    winners, asesinoGano, isDisgraceVictory,
    isDiscardButtonEnabled, currentPlayerId,
    roles, displayedOpponents, draftCards, discardPile,
    playerTurnState, selectedDraftCards, isPickupButtonEnabled,
    playedSetsByPlayer,
    isPlayButtonEnabled,
    isSecretsModalOpen, isSecretsLoading, playerSecretsData, viewingSecretsOfPlayer,
    playersSecrets,
    isPlayerSelectionModalOpen, setEventCardInPlay,
    canRevealSecrets, canHideSecrets, selectedSecretCard, canRobSecrets, isSetSelectionModalOpen,
    disgracedPlayerIds, isLocalPlayerDisgraced, mySecretCards, isConfirmationModalOpen,
    lookIntoAshesModalOpen, setLookIntoAshesModalOpen,
    discardPileSelection, setDiscardPileSelection,
    selectedDiscardCard, setSelectedDiscardCard, setEventCardToPlay,
    isPysVotingModalOpen, setIsPysVotingModalOpen, setTurnStartedAt, turnStartedAt,
    pysActorId, setPysActorId,
    pysLoadingMessage, setPysLoadingMessage,
    pysVotos, setPysVotos, isMyTurn,
    isAddToSetModalOpen, setAddToSetModalOpen,
  } = gameState;

  const { handleSetPlayedEvent, modals: detectiveModals } = useDetectiveSecretReveal(gameId, gameState, players);

  const {
    accionEnProgreso,
    actionResultMessage,
    setActionResultMessage,
    iniciarAccionCancelable,
    wsCallbacks: actionStackCallbacks,
  } = useActionStack(gameId, gameState.currentPlayerId, handleSetPlayedEvent);

  gameState.accionEnProgreso = accionEnProgreso;

  



  // Log de inicio de partida (solo una vez cuando hay jugadores y turno)
  useEffect(() => {
    if (players.length > 0 && currentTurn && events.length === 0) {
      logGameStart();
      // Log del primer turno
      const firstPlayer = players.find(p => p.id_jugador === currentTurn);
      if (firstPlayer) {
        logTurnStart(firstPlayer.nombre_jugador);
      }
    }
  }, [players, currentTurn, events.length, logGameStart, logTurnStart]);

  // Desarrollo solamente

  if (import.meta.env.DEV) {
    window.gameState = gameState;
  }

  const { handleOpenSecretsModal, handleCloseSecretsModal } = useSecrets(gameId, gameState);
  // Secret actions handlers used by SecretsModal
  const { handleSecretCardClick, handleRevealSecret, handleHideSecret, handleRobSecret } = useSecretActions(gameId, gameState);


  const baseWebSocketCallbacks = useMemo(() => ({
    onDeckUpdate: (count) => gameState.setDeckCount(count),

    onCardsOffTheTablePlayed: (message) => {
      const { jugador_id: actorId, objetivo_id: targetId } = message;
      const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
      const targetName = gameState.players.find(p => p.id_jugador === targetId)?.nombre_jugador || 'otro jugador';

      setEventCardInPlay({
        imageName: '17-event_cardsonthetable.png',
        message: `${actorName} jugó "Cards off the Table" sobre ${targetName}`,
      });
      
      logEventCardPlayed(actorName, 17);
    },

    onAnotherVictimPlayed: async (message) => {

      const {
        jugador_id: actorId,
        objetivo_id: targetId,
        representacion_id: repId
      } = message;
      const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
      const targetName = gameState.players.find(p => p.id_jugador === targetId)?.nombre_jugador || 'otro jugador';

      gameState.setEventCardInPlay({
        imageName: '18-event_anothervictim.png',
        message: `${actorName} robó un set de ${targetName}`
      });
      
      logEventCardPlayed(actorName, 18);

      try {
        const allSets = await apiService.getPlayedSets(gameId);
        const groupedSets = {};
        (allSets || []).forEach(item => {
          const arr = groupedSets[item.jugador_id] || [];
          arr.push(item);
          groupedSets[item.jugador_id] = arr;
        });
        gameState.setPlayedSetsByPlayer(groupedSets);

        // If we stole the set, find it and trigger its effect with full card info
        if (actorId === gameState.currentPlayerId) {
          

          // Find the stolen set in the fetched data to get cartas_ids
          const stolenSet = (allSets || []).find(
            set => set.jugador_id === actorId && set.representacion_id_carta === repId
          );

          handleSetPlayedEvent?.({
            jugador_id: actorId,
            representacion_id: repId,
            cartas_ids: stolenSet?.cartas_ids || []
          });
        }
      } catch (error) {
        console.error("Error al refrescar sets tras Another Victim:", error);
      }
    },

    onOneMorePlayed: async (message) => {
      const { jugador_id: actorId, objetivo_id: sourceId, destino_id: destinationId } = message;
      const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
      const sourceName = gameState.players.find(p => p.id_jugador === sourceId)?.nombre_jugador || 'un jugador';
      const destName = gameState.players.find(p => p.id_jugador === destinationId)?.nombre_jugador || 'otro jugador';

      gameState.setEventCardInPlay({
        imageName: '22-event_onemore.png',
        message: `${actorName} robó un secreto de ${sourceName} y se lo dio a ${destName}`
      });
      
      logEventCardPlayed(actorName, 22);
    },

    onHandUpdate: (message) => {
      console.log("Mensaje completo de WS:", message);
      const nuevaManoRaw = message.data;

      const nuevaManoProcesada = cardService.getPlayingHand(nuevaManoRaw);

      const handWithInstanceIds = nuevaManoProcesada.map((card, index) => {
        return {
          ...card,
          instanceId: `card-inst-${card.id_instancia}`,
          id_instancia: card.id_instancia
        };
      });

      console.log("Mano final que se setea:", handWithInstanceIds);
      gameState.setHand(handWithInstanceIds);
    },

    onTurnUpdate: (turn) => {
      gameState.setCurrentTurn(turn);
      gameState.setPlayerTurnState('discarding');
      gameState.setHasPlayedSetThisTurn(false);
      
      // Log del inicio de turno
      const player = gameState.players.find(p => p.id_jugador === turn);
      if (player) {
        logTurnStart(player.nombre_jugador);
      }
      
      // Iniciar el timer del turno
      setTurnStartedAt(Date.now());
    },

    onDraftUpdate: (newDraftData) => {
      const processedDraftCards = cardService.getDraftCards(newDraftData);
      const draftWithInstanceIds = processedDraftCards.map((card, index) => ({
        ...card,
        instanceId: `draft-${card.id}-${Date.now()}-${index}`,
      }));
      gameState.setDraftCards(draftWithInstanceIds);
    },

    onGameEnd: ({ winners, asesinoGano }) => {
      gameState.setWinners(winners);
      gameState.setAsesinoGano(asesinoGano);
    },

    onSetPlayed: async (payload) => {
      try {
        const { jugador_id: actorId, representacion_id: repId, cartas_ids: cardsIds } = payload;
        const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
        const setImageUrl = cardService.getCardImageUrl(repId);

        gameState.setEventCardInPlay({
          imageName: setImageUrl,
          message: `${actorName} jugó un Set de Detectives`
        });
        
        logSetPlayed(actorName, repId, cardsIds || []);

        // --- FIN DE LA MODIFICACIÓN ---
        const allSets = await apiService.getPlayedSets(gameId);

        const groupedSets = {};
        (allSets || []).forEach(item => {
          const arr = groupedSets[item.jugador_id] || [];
          arr.push(item);
          groupedSets[item.jugador_id] = arr;
        });

        gameState.setPlayedSetsByPlayer(groupedSets);
      } catch (error) {
        console.error("Error al refrescar sets tras 'onSetPlayed':", error);
      } finally {
        // Disparar flujo de selección (detective/lady/parker) si aplica
        handleSetPlayedEvent?.(payload);
      }
    },

    onDelayEscapePlayed: async (message) => {
      const actorName = gameState.players.find(p => p.id_jugador === message.jugador_id)?.nombre_jugador || 'Un jugador';
      gameState.setEventCardInPlay({
        imageName: '23-event_delayescape.png',
        message: `Se jugó "Delay The Murderer Escape"`
      });
      
      logEventCardPlayed(actorName, 23);
      // Forzar a todos los clientes a refrescar los datos afectados
      try {
        const [deckData, discardData] = await Promise.all([
          apiService.getDeckCount(gameId),
          apiService.getDiscardPile(gameId, gameState.currentPlayerId, 1)
        ]);
        gameState.setDeckCount(deckData);
        gameState.setDiscardPile(Array.isArray(discardData) ? discardData.map(c => ({ id: c.id })) : []);
      } catch (error) {
        console.error("Error al refrescar estado tras Delay Escape:", error);
      }
    },

    onSecretUpdate: async ({ playerId, secrets }) => {
      const isNowDisgraced = secrets.every(s => s.revelado);
      const revealedCount = secrets.filter(s => s.revelado).length;
      const hiddenCount = secrets.length - revealedCount;

      let updatedDisgracedSet = new Set();

      gameState.setDisgracedPlayerIds(prevSet => {
        const newSet = new Set(prevSet);
        if (isNowDisgraced) {
          newSet.add(playerId);
        } else {
          newSet.delete(playerId);
        }
        updatedDisgracedSet = newSet;
        return newSet;
      });

      gameState.setPlayersSecrets(prev => ({
        ...prev,
        [playerId]: { revealed: revealedCount, hidden: hiddenCount },
      }));

      try {
        if (playerId === gameState.currentPlayerId) {
          const freshSecrets = await apiService.getMySecrets(gameId, gameState.currentPlayerId);
          const processedMySecrets = freshSecrets.map(secret => {
            const cardDetails = cardService.getSecretCards([{ id: secret.id }])[0];
            const revelada = Boolean(secret.bocaArriba || secret.revelada || secret.revelado);
            return { ...secret, revelada, url: cardDetails?.url };
          });
          gameState.setMySecretCards(processedMySecrets);
        }

        if (gameState.viewingSecretsOfPlayer?.id_jugador === playerId) {
          const freshModalSecrets = await apiService.getPlayerSecrets(gameId, playerId);
          const processedModalSecrets = freshModalSecrets.map(secret => {
            if (secret.bocaArriba) {
              const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
              return { ...secret, ...cardDetails };
            }
            return secret;
          });
          gameState.setPlayerSecretsData(processedModalSecrets);
        }

        // Verificar victoria por desgracia social
        // Esperar un momento para que el estado se actualice completamente
        setTimeout(() => {
          // Si ya hay ganadores, no hacer nada
          if (gameState.winners) return;

          // Necesitamos tener la información de roles y jugadores
          if (!gameState.roles.murdererId || !gameState.players || gameState.players.length === 0) return;

          // Determinar qué jugadores no están en desgracia
          const playersNotDisgraced = gameState.players.filter(player => !updatedDisgracedSet.has(player.id_jugador));

          // Verificar si solo quedan el asesino (y cómplice si existe)
          const expectedSurvivors = [gameState.roles.murdererId];
          if (gameState.roles.accompliceId) {
            expectedSurvivors.push(gameState.roles.accompliceId);
          }

          // Todos los jugadores no en desgracia deben ser exactamente el asesino y/o cómplice
          const allDisgracedExceptMurderers =
            playersNotDisgraced.length === expectedSurvivors.length &&
            playersNotDisgraced.every(player => expectedSurvivors.includes(player.id_jugador));

          if (allDisgracedExceptMurderers) {
            // Activar el modal de fin de partida
            gameState.setWinners([]);
            gameState.setAsesinoGano(true);
            gameState.setIsDisgraceVictory(true);
          }
        }, 100);
      } catch (error) {
        console.error("Error al refrescar secretos vía WebSocket:", error);
      }
    },
    onEarlyTrainPlayed: (message) => {
      const actorName = gameState.players.find(p => p.id_jugador === message.jugador_id)?.nombre_jugador || 'Un jugador';
      gameState.setEventCardInPlay({
        imageName: '24-event_earlytrain.png',
        message: `Se jugó "Early Train To Paddington"`
      });
      
      logEventCardPlayed(actorName, 24);
    },

    onLookIntoTheAshesPlayed: (message) => {
      const { playerId } = message;
      const playerName = players.find(p => p.id_jugador === playerId)?.nombre_jugador || 'Alguien';

      // Mostrar notificación automáticamente cuando se recibe el WebSocket
      setEventCardInPlay({
        imageName: cardService.getCardImageUrl(20), // URL de la carta "Look Into The Ashes"
        message: `${playerName} jugó "Look Into The Ashes"!`
      });
      
      logEventCardPlayed(playerName, 20);

      // Auto-ocultar después de 3 segundos
      setTimeout(() => {
        setEventCardInPlay(null);
      }, 3000);
    },

    onPointYourSuspicionsPlayed: (message) => {
      const actorName = gameState.players.find(p => p.id_jugador === message.jugador_id)?.nombre_jugador || 'Un jugador';
      gameState.setPysActorId(message.jugador_id);
      gameState.setIsPysVotingModalOpen(true);
      gameState.setPysLoadingMessage(null); // Limpiar mensaje de "esperando"
      gameState.setPysVotos({}); // Limpiar votos
      
      logEventCardPlayed(actorName, 25);
    },

    onVotoRegistrado: (message) => {
      gameState.setPysVotos(prev => ({
        ...prev,
        [message.votante_id]: true
      }));
    },

    onVotacionFinalizada: (message) => {
      gameState.setIsPysVotingModalOpen(false); // Cerrar el modal de votación
      gameState.setPysLoadingMessage(null); // Limpiar

      const sospechoso = gameState.players.find(p => p.id_jugador === message.sospechoso_id);
      const sospechosoNombre = sospechoso?.nombre_jugador || `Jugador ${message.sospechoso_id}`;

      gameState.setEventCardInPlay({
        imageName: cardService.getCardImageUrl(PYS_ID),
        message: `${sospechosoNombre} fue el más sospechado y debe revelar una carta.`
      });

      if (gameState.currentPlayerId === gameState.pysActorId) {
        console.log("Somos el actor, solicitando revelación...");
        apiService.requestTargetToRevealSecret(
          gameId,
          gameState.pysActorId,
          message.sospechoso_id,
          'point-your-suspicions'
        );
      }
    },  
    onCardTradePlayed: (message) => {
      const { jugador_id: actorId, objetivo_id: targetId } = message;
      const actorName =
        gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
      const targetName =
        gameState.players.find(p => p.id_jugador === targetId)?.nombre_jugador || 'otro jugador';

      // Mostrar efecto visual
      gameState.setEventCardInPlay({
        imageName: cardService.getCardImageUrl(CARD_IDS.CARD_TRADE),
        message: `${actorName} inició un intercambio de cartas con ${targetName}`,
      });
      
      logEventCardPlayed(actorName, CARD_IDS.CARD_TRADE);

      // Si este cliente es el actor o el objetivo, abrir modal
      if (targetId === gameState.currentPlayerId || actorId === gameState.currentPlayerId) {
        const handSnapshot = [...(gameState.hand || [])]; // snapshot mano antes de abrir modal

        gameState.setCardTradeContext({
          originId: actorId,
          targetPlayerId: targetId,
          handSnapshot,
        });

        gameState.setCardTradeModalOpen(true);
      }
    },




  onDeadCardFollyPlayed: (message) => {
    const { jugador_id: actorId, direccion, orden } = message;
    const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || "Un jugador";

    gameState.setEventCardInPlay({
      imageName: cardService.getCardImageUrl(CARD_IDS.DEAD_CARD_FOLLY),
      message: `${actorName} jugó "Dead Card Folly" (${direccion})`,
    });

    // Calcular a quién debe enviar carta el jugador actual
    const myId = gameState.currentPlayerId;
    const i = orden.indexOf(myId);
    if (i === -1) return;
    
    const n = orden.length;
    const targetPlayerId = direccion === "izquierda" 
      ? orden[(i - 1 + n) % n] 
      : orden[(i + 1) % n];

    console.log(`[DeadCardFolly] Jugador ${myId} debe enviar carta a ${targetPlayerId}`, { orden, direccion });

    // Abrir modal de Card Trade para que el jugador envíe una carta
    if (targetPlayerId) {
      const handSnapshot = [...(gameState.hand || [])]; // snapshot mano antes de abrir modal
      gameState.setCardTradeContext({
        originId: myId, 
        targetPlayerId: targetPlayerId,
        handSnapshot,
      });
      gameState.setCardTradeModalOpen(true);
    }
  },

    onSocialFauxPasPlayed: async (message) => {
      const { jugador_emisor: senderId, jugador_objetivo: targetId } = message.data;
      const senderName = gameState.players.find(p => p.id_jugador === senderId)?.nombre_jugador || 'Un jugador';
      const targetName = gameState.players.find(p => p.id_jugador === targetId)?.nombre_jugador || 'otro jugador';

      // Mostrar notificación del evento
      gameState.setEventCardInPlay({
        imageName: cardService.getCardImageUrl(CARD_IDS.SOCIAL_FAUX_PAS),
        message: `${senderName} jugó "Social Faux Pas" sobre ${targetName}`
      });

      // Si somos el objetivo, abrir nuestros secretos para revelar uno
      if (targetId === gameState.currentPlayerId) {
        const currentPlayer = gameState.players.find(p => p.id_jugador === gameState.currentPlayerId);
        
        // Configurar el modal de secretos para Social Faux Pas
        gameState.setCanRevealSecrets(true);
        gameState.setCanHideSecrets(false);
        gameState.setCanRobSecrets(false);
        
        // Abrir el modal de nuestros propios secretos
        handleOpenSecretsModal(currentPlayer);
      }
    },
    onBlackmailedPlayed: async (message) => {
      /* Nota: en realidad deberia mostrar el secreto, no revelarlo, pero por cuestion de tiempo
       y para no dejarlo sin implementar el efecto va a ser igual que el de social faux*/
      const { jugador_emisor: senderId, jugador_objetivo: targetId } = message.data;
      const senderName = gameState.players.find(p => p.id_jugador === senderId)?.nombre_jugador || 'Un jugador';
      const targetName = gameState.players.find(p => p.id_jugador === targetId)?.nombre_jugador || 'otro jugador';

      gameState.setEventCardInPlay({
        imageName: cardService.getCardImageUrl(CARD_IDS.BLACKMAILED),
        message: `${senderName} jugó "Blackmailed" sobre ${targetName}`
      });

      if (targetId === gameState.currentPlayerId) {
        const currentPlayer = gameState.players.find(p => p.id_jugador === gameState.currentPlayerId);
        
        gameState.setCanRevealSecrets(true);
        gameState.setCanHideSecrets(false);
        gameState.setCanRobSecrets(false);
        
        handleOpenSecretsModal(currentPlayer);
      }
    },
    onDiscardUpdate: (discardPile) => gameState.setDiscardPile(discardPile),
  }), [gameState]);

  const webSocketCallbacks = useMemo(() => ({
    ...baseWebSocketCallbacks,
    ...actionStackCallbacks,
  }), [baseWebSocketCallbacks, actionStackCallbacks]);

  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);

  const {
    handleCardClick,
    handleDraftCardClick,
    handleDiscard,
    handlePickUp,
    handlePlay,
    handleEventActionConfirm,
    handleCardTradeConfirm,
    handleLookIntoTheAshesConfirm,
    handleOneMoreSecretSelect,
    handleAddToSetConfirm,
    handleSendCardTradeResponse,
    handleDeadCardFollyConfirm
  } = useCardActions(
    gameId,
    gameState,
    () => { },
    iniciarAccionCancelable,
    logCardAddedToSet,
    logEventCardPlayed,
    logAriadneOliverPlayed
  );

  const { timeLeft } = useTurnTimer({
    gameId,
    currentPlayerId,
    currentTurn,
    hand,
    setHand: gameState.setHand,
    turnStartedAt,
    isMyTurn,
    playerTurnState: playerTurnState
  });

  const handleEventDisplayComplete = useCallback(() => {
    gameState.setEventCardInPlay(null);
  }, [gameState.setEventCardInPlay]); 
  
  const handleActionResultToastClose = useCallback(() => {
    setActionResultMessage(null);
  }, [setActionResultMessage]); 

  const sortedHand = useMemo(() => {
    return [...hand].sort((a, b) => a.id - b.id);
  }, [hand]);
  const mySecretsForCarousel = useMemo(() => {
    return (mySecretCards || []).map((s, idx) => ({
      instanceId: String(s.id_instancia ?? s.instanceId ?? `${s.url}-${idx}`),
      url: s.url,
      revelada: Boolean(s.revelada || s.bocaArriba || s.revelado),
    }));
  }, [mySecretCards]);

  const getPlayerEmoji = gameState.getPlayerEmoji;
  const isDrawingPhase = playerTurnState === 'drawing' && gameState.isMyTurn;

  // Also glow the deck/draft when a set was played and player can pick up to reach 6
  const canPickAfterSet = gameState.hasPlayedSetThisTurn && gameState.isMyTurn && hand.length < 6;

  const opponentPlayers = useMemo(() => {
    return players.filter(p => p.id_jugador !== currentPlayerId);
  }, [players, currentPlayerId]);

  const opponentSets = useMemo(() => {
    const sets = { ...playedSetsByPlayer };
    if (sets[currentPlayerId]) {
      delete sets[currentPlayerId];
    }
    return sets;
  }, [playedSetsByPlayer, currentPlayerId]);

  // Para Ariadne (id 15), no se pueden elegir sets propios; solo de oponentes
  const setsForSelection = useMemo(() => {
    return opponentSets;
  }, [opponentSets]);

  const myMatchingSets = useMemo(() => {
    const cardToPlay = gameState.eventCardToPlay;
    if (!isAddToSetModalOpen || !cardToPlay) return {};

    const myPlayer = players.find(p => p.id_jugador === currentPlayerId);
    const mySets = playedSetsByPlayer[currentPlayerId] || [];

    // Filtramos solo los sets que coinciden con el TIPO de la carta seleccionada
    const matching = mySets.filter(set => set.representacion_id_carta === cardToPlay.id);

    // El modal espera un objeto { [playerId]: [sets] }
    return myPlayer ? { [myPlayer.id_jugador]: matching } : {};
  }, [isAddToSetModalOpen, playedSetsByPlayer, currentPlayerId, players, gameState.eventCardToPlay]);

  const myPlayerObject = useMemo(() => {
    return players.filter(p => p.id_jugador === currentPlayerId);
  }, [players, currentPlayerId]);


  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

  const isResponseWindowOpen = !!accionEnProgreso;

  const currentPlayer = players.find(p => p.id_jugador === currentPlayerId);
  const currentPlayerName = currentPlayer?.nombre_jugador || 'Jugador';

  return (
    <div className={styles.gameContainer}>
      {winners && (
        <GameOverScreen
          winners={winners}
          asesinoGano={asesinoGano}
          isDisgraceVictory={isDisgraceVictory}
          players={players}
          roles={roles}
          setRoles={gameState.setRoles}
          gameId={gameId}
          onReturnToMenu={() => navigate("/")}
        />
      )}
      <TurnTimer timeLeft={timeLeft} maxTime={TURN_DURATION} />
      <EventDisplay
        card={gameState.eventCardInPlay}
        onDisplayComplete={handleEventDisplayComplete}
      />
      <ActionStackModal
        accion={accionEnProgreso}
        durationSeconds={NOT_SO_FAST_WINDOW_MS / 1000}
      />
      <ActionResultToast
        message={actionResultMessage}
        onClose={handleActionResultToastClose}
      />

      <div className={styles.opponentsContainer} data-player-count={players.length}>
        {displayedOpponents.map((player, index) => (
          <div key={player.id_jugador} className={`${styles.opponent} ${styles[`opponent-${index + 1}`]}`}>
            <PlayerPod
              player={player}
              isCurrentTurn={player.id_jugador === currentTurn}
              roleEmoji={getPlayerEmoji(player.id_jugador)}
              sets={(playedSetsByPlayer[player.id_jugador] || []).map(item => ({ id: item.representacion_id_carta }))}
              onSecretsClick={handleOpenSecretsModal}
              playerSecrets={playersSecrets[player.id_jugador]}
              isDisgraced={disgracedPlayerIds.has(player.id_jugador)}
            />
          </div>
        ))}
      </div>

      <div className={styles.centerArea}>

        <div className={styles.decksContainer}>
          <Deck count={deckCount} isGlowing={isDrawingPhase || canPickAfterSet} />
          <DiscardDeck cards={discardPile} />
        </div>
        <CardDraft
          cards={draftCards}
          selectedCards={selectedDraftCards}
          onCardClick={handleDraftCardClick}
          isGlowing={isDrawingPhase || canPickAfterSet}
        />
      </div>

      <div className={`${styles.bottomContainer} ${(gameState.isMyTurn && !isDrawingPhase) ? styles.myTurn : ''} ${isResponseWindowOpen ? styles.handOnTop : ''}`}>
        {isLocalPlayerDisgraced && <DisgraceOverlay />}
        <div className={styles.playerArea}>
          {/* Secret cards carousel */}
          <MySecretsCarousel secretCards={mySecretsForCarousel} />

          <div>
            <div data-testid="hand-container" className={styles.handContainer}>
              {sortedHand.map((card) => {
                const isNSF = card.id === NOT_SO_FAST_ID;
                const isSelectableInTurn = gameState.isMyTurn && playerTurnState === 'discarding';

                let isDisabled = true;
                let isGlowing = false;

                if (isResponseWindowOpen) {
                  if (isNSF) {
                    isDisabled = false; // Se puede jugar NSF
                    isGlowing = true;
                  }
                } else if (isSelectableInTurn) {
                  isDisabled = false;
                }

                return (
                  <Card
                    key={card.instanceId}
                    imageName={card.url}
                    isSelected={selectedCards.includes(card.instanceId)}
                    onCardClick={() => {
                      handleCardClick(card.instanceId)
                      console.log(`[GamePage] Clickeado instanceId: ${card.instanceId}`);
                    }}
                    subfolder="game-cards"
                    isGlowing={isGlowing}
                    isDisabled={isDisabled}
                  />
                );
              })}
            </div>
          </div>

          {/* My played sets (compact carousel with max 3 visible) */}
          <div className={styles.mySetsContainer}>
            <MySetsCarousel
              sets={(playedSetsByPlayer[currentPlayerId] || []).map(item => ({ id: item.representacion_id_carta }))}
            />
          </div>

          <div className={styles.actionsContainer}>
            {/* Selected indicator and Play button */}
            <div className={styles.playControls}>
              <span className={styles.selectedInfo}>
                Seleccionadas: {selectedCards.length}
              </span>
              <button
                onClick={handlePlay}
                disabled={!isPlayButtonEnabled}
                className={`${styles.playButton} ${isPlayButtonEnabled ? styles.enabled : ''}`}
              >
                Jugar
              </button>
            </div>
            {/* Descartar is visible during discarding phase */}
            {playerTurnState === 'discarding' && (
              <button
                onClick={handleDiscard}
                disabled={!isDiscardButtonEnabled}
                className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
              >
                Descartar
              </button>
            )}
            {/* Levantar is visible while drawing OR after playing a set (hand < 6) even in discarding */}
            {(playerTurnState !== 'discarding' || (gameState.hasPlayedSetThisTurn && gameState.isMyTurn && hand.length < 6)) && (
              <button
                onClick={handlePickUp}
                disabled={!isPickupButtonEnabled || isResponseWindowOpen}
                className={`${styles.discardButton} ${isPickupButtonEnabled ? styles['pickup-enabled'] : ''}`}
              >
                Levantar
              </button>
            )}
          </div>
        </div>
      </div>
      <SecretsModal
        isOpen={isSecretsModalOpen}
        onClose={handleCloseSecretsModal}
        player={viewingSecretsOfPlayer}
        secrets={playerSecretsData}
        isLoading={isSecretsLoading}
        canHideSecrets={canHideSecrets && gameState.oneMoreStep !== 2}
        canRevealSecrets={canRevealSecrets && gameState.oneMoreStep !== 2}
        canRobSecrets={canRobSecrets && gameState.oneMoreStep !== 2}
        selectedSecret={selectedSecretCard}
        onSecretSelect={gameState.oneMoreStep === 2 ? (secretId) => {
          // In OneMore flow, update selected secret state
          gameState.setSelectedSecretCard(secretId);
        } : handleSecretCardClick}
        onConfirmSelection={gameState.oneMoreStep === 2 ? handleOneMoreSecretSelect : undefined}
        onRevealSecret={() => handleRevealSecret(viewingSecretsOfPlayer?.id_jugador)}
        onHideSecret={() => handleHideSecret(viewingSecretsOfPlayer?.id_jugador)}
        onRobSecret={() => handleRobSecret(viewingSecretsOfPlayer?.id_jugador)}
        selectable={gameState.oneMoreStep === 2}
        selectRevealedOnly={gameState.oneMoreStep === 2}
        hideCloseButton={gameState.oneMoreStep === 2}
      />

      {detectiveModals}

      <PlayerSelectionModal
        isOpen={isPlayerSelectionModalOpen}
        onClose={() => {
          gameState.setPlayerSelectionModalOpen(false);
          if (gameState.oneMoreStep > 0) {
            // Reset OneMore flow if cancelled
            gameState.setOneMoreStep(0);
            gameState.setOneMoreSourcePlayer(null);
            gameState.setOneMoreSelectedSecret(null);
            gameState.setEventCardToPlay(null);
          }
        }}
        players={
          gameState.oneMoreStep === 1
            ? players.filter(p => (playersSecrets[p.id_jugador]?.revealed ?? 0) > 0) // Step 1: Only players with revealed secrets
            : gameState.oneMoreStep === 3
              ? players // Step 3: Allow choosing any player, including source
              : opponentPlayers // Other events: only opponents
        }
        onPlayerSelect={(playerId) => {
          if (gameState.eventCardToPlay?.id === CARD_IDS.CARD_TRADE) {
            handleCardTradeConfirm(playerId);
          } else {
            handleEventActionConfirm(playerId);
          }
        }}
        title={
          gameState.eventCardToPlay?.id === CARD_IDS.CARD_TRADE
            ? "Card Trade: selecciona un jugador para intercambiar cartas"
            :gameState.oneMoreStep === 1
              ? "And Then There Was One More: Elige un jugador con secretos revelados"
            : gameState.oneMoreStep === 3
              ? "And Then There Was One More: Elige el jugador destino"
              : "Cards off the Table: Elige un jugador"
        }
      />
      <SetSelectionModal
        isOpen={isSetSelectionModalOpen}
        onClose={() => gameState.setSetSelectionModalOpen(false)}
        opponentSets={setsForSelection}
        players={players}
        onSetSelect={handleEventActionConfirm}
        title={gameState.eventCardToPlay?.id === 15 ? 'Ariadne Oliver: Elige un set donde agregarla' : 'Another Victim: Elige un set para robar'}
        data-testid="another-victim-modal"
      />
      <SetSelectionModal
        isOpen={isAddToSetModalOpen}
        onClose={() => setAddToSetModalOpen(false)}
        opponentSets={myMatchingSets} // Usar los sets filtrados
        players={myPlayerObject}      // Solo nosotros
        onSetSelect={handleAddToSetConfirm}
        title="Añadir a Set Existente"
        data-testid="add-to-set-modal"
      />
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => gameState.setConfirmationModalOpen(false)}
        onConfirm={handleEventActionConfirm}
        title="Delay The Murderer Escape"
        message="Elige cuántas cartas mover del descarte al mazo (1-5)."
      />

      <LookIntoAshesModal
        isOpen={lookIntoAshesModalOpen}
        onClose={() => {
          setLookIntoAshesModalOpen(false);
          setDiscardPileSelection([]);
          setSelectedDiscardCard(null);
          setEventCardToPlay(null);
          setSelectedCards([]);
        }}
        discardCards={discardPileSelection}
        selectedCard={selectedDiscardCard}
        onCardSelect={setSelectedDiscardCard}
        onConfirm={() => handleLookIntoTheAshesConfirm()}
      />
      <PlayerSelectionModal
        isOpen={isPysVotingModalOpen}
        onClose={() => {
          // No permitir cerrar
          if (!pysLoadingMessage) {
            alert("Debes votar para continuar.");
          }
        }}
        players={players} // Mostrar todos los jugadores
        onPlayerSelect={async (targetPlayerId) => {
          try {
            // Poner el modal en estado "cargando"
            gameState.setPysLoadingMessage("Esperando a que los demás jugadores voten...");

            // Enviar nuestro voto
            await apiService.votePointYourSuspicions(
              gameId,
              pysActorId, // El actor que inició PYS
              currentPlayerId, // Nosotros 
              targetPlayerId   // El objetivo
            );

            //  El modal NO se cierra. Se queda en "Esperando..."
            //    hasta que llegue el WS 'votacion-finalizada'.

          } catch (error) {
            console.error("Error al votar PYS:", error);
            alert(`Error al votar: ${error.message}`);
            gameState.setPysLoadingMessage(null);
          }
        }}
        title="¿A quién sospechás como el asesino?"
        loadingMessage={pysLoadingMessage}
        hideCloseButton={true}
      />
      <Chat 
        gameId={gameId}
        playerId={currentPlayerId}
        playerName={currentPlayerName}
        websocketService={websocketService}
      />
      <DeadCardFollyModal
        isOpen={gameState.isDeadCardFollyModalOpen}
        onClose={() => gameState.setDeadCardFollyModalOpen(false)}
        onConfirm={(direccion) => handleDeadCardFollyConfirm(direccion)}
      />
      <CardTradeModal
        isOpen={gameState.isCardTradeModalOpen}
        hand={gameState.cardTradeContext?.handSnapshot || hand}
        onClose={() => gameState.setCardTradeModalOpen(false)}
        onConfirm={(cardId) => handleSendCardTradeResponse(cardId)}
      />

      <EventLogModal
        isOpen={isEventLogOpen}
        onClose={() => setIsEventLogOpen(false)}
        events={events}
      />

      {/* Botón flotante para abrir el log de eventos */}
      <button
        onClick={() => setIsEventLogOpen(true)}
        className={styles.eventLogFloatingButton}
        title="Ver log de eventos"
      >
        📋
      </button>
    </div>
  );
};
export default GamePage;