import { useParams, useNavigate } from 'react-router-dom';
import { cardService } from '@/services/cardService';
import { useMemo, useEffect } from 'react';
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
// Hooks
import useWebSocket from '@/hooks/useGameWebSockets';
import useGameState from '@/hooks/useGameState';
import useGameData from '@/hooks/useGameData';
import useCardActions, { useSecrets } from '@/hooks/useCardActions';
import PlayerSelectionModal from '@/components/EventModals/PlayerSelectionModal';
import EventDisplay from '@/components/EventModals/EventDisplay';
import useSecretActions from '@/hooks/useSecretActions';
import ActionStackModal from '@/components/EventModals/ActionStackModal';
import ActionResultToast from '@/components/EventModals/ActionResultToast';
import useActionStack from '@/hooks/useActionStack';


// Styles
import styles from './GamePage.module.css';

const NOT_SO_FAST_ID = 16;
const NOT_SO_FAST_WINDOW_MS = 5000;

const GamePage = () => {

  const { id: gameId } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  const gameState = useGameState();
  const {
    hand, selectedCards, isLoading,
    deckCount, currentTurn, /* turnOrder */ players,
    winners, asesinoGano,
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
  } = gameState;

  const {
    accionEnProgreso,
    actionResultMessage,
    setActionResultMessage,
    iniciarAccionCancelable,
    wsCallbacks: actionStackCallbacks,
  } = useActionStack(gameId, gameState.currentPlayerId);

  gameState.accionEnProgreso = accionEnProgreso;


  // Desarrollo solamente

  if (import.meta.env.DEV) {
    window.gameState = gameState;
  }

  const { handleOpenSecretsModal, handleCloseSecretsModal } = useSecrets(gameId, gameState);
  const { handleSetPlayedEvent, modals: detectiveModals } = useDetectiveSecretReveal(gameId, gameState, players);
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

      try {
        const allSets = await apiService.getPlayedSets(gameId);
        const groupedSets = {};
        (allSets || []).forEach(item => {
          const arr = groupedSets[item.jugador_id] || [];
          arr.push(item);
          groupedSets[item.jugador_id] = arr;
        });
        gameState.setPlayedSetsByPlayer(groupedSets);
      } catch (error) {
        console.error("Error al refrescar sets tras Another Victim:", error);
      }

      if (actorId === gameState.currentPlayerId) {
        console.log("[GamePage] ¡Robamos un set! Disparando efecto del set...", message);

        handleSetPlayedEvent?.({
          jugador_id: actorId,
          representacion_id: repId
        });
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
        const { jugador_id: actorId, representacion_id: repId } = payload;
        const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
        const setImageUrl = cardService.getCardImageUrl(repId);

        gameState.setEventCardInPlay({
          imageName: setImageUrl,
          message: `${actorName} jugó un Set de Detectives`
        });
        
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
      gameState.setEventCardInPlay({
        imageName: '23-event_delayescape.png',
        message: `Se jugó "Delay The Murderer Escape"`
      });
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

      gameState.setDisgracedPlayerIds(prevSet => {
        const newSet = new Set(prevSet);
        if (isNowDisgraced) {
          newSet.add(playerId);
        } else {
          newSet.delete(playerId);
        }
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
      } catch (error) {
        console.error("Error al refrescar secretos vía WebSocket:", error);
      }
    },
    onEarlyTrainPlayed: (message) => {
      gameState.setEventCardInPlay({
        imageName: '24-event_earlytrain.png',
        message: `Se jugó "Early Train To Paddington"`
      });
    },

    onLookIntoTheAshesPlayed: (message) => {
      const { playerId } = message;
      const playerName = players.find(p => p.id_jugador === playerId)?.nombre_jugador || 'Alguien';

      // Mostrar notificación automáticamente cuando se recibe el WebSocket
      setEventCardInPlay({
        imageName: cardService.getCardImageUrl(20), // URL de la carta "Look Into The Ashes"
        message: `${playerName} jugó "Look Into The Ashes"!`
      });

      // Auto-ocultar después de 3 segundos
      setTimeout(() => {
        setEventCardInPlay(null);
      }, 3000);
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
    handleLookIntoTheAshesConfirm,
    handleOneMoreSecretSelect
  } = useCardActions(
    gameId,
    gameState,
    () => { },
    iniciarAccionCancelable
  );


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


  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

  const isResponseWindowOpen = !!accionEnProgreso;

  return (
    <div className={styles.gameContainer}>
      {winners && (
        <GameOverScreen
          winners={winners}
          asesinoGano={asesinoGano}
          players={players}
          roles={roles}
          setRoles={gameState.setRoles}
          gameId={gameId}
          onReturnToMenu={() => navigate("/")}
        />
      )}
      <EventDisplay
        card={gameState.eventCardInPlay}
        onDisplayComplete={() => gameState.setEventCardInPlay(null)}
      />
      <ActionStackModal
        accion={accionEnProgreso}
        durationSeconds={NOT_SO_FAST_WINDOW_MS / 1000}
      />
      <ActionResultToast
        message={actionResultMessage}
        onClose={() => setActionResultMessage(null)}
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
                disabled={!isPickupButtonEnabled}
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
        onPlayerSelect={handleEventActionConfirm}
        title={
          gameState.oneMoreStep === 1
            ? "And Then There Was One More: Elige un jugador con secretos revelados"
            : gameState.oneMoreStep === 3
              ? "And Then There Was One More: Elige el jugador destino"
              : "Cards off the Table: Elige un jugador"
        }
      />
      <SetSelectionModal
        isOpen={isSetSelectionModalOpen}
        onClose={() => gameState.setSetSelectionModalOpen(false)}
        opponentSets={opponentSets}
        players={players}
        onSetSelect={handleEventActionConfirm}
        title="Another Victim: Elige un set para robar"
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
    </div>
  );
};
export default GamePage;