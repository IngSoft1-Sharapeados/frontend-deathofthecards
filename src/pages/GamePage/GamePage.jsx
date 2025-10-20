import { useParams, useNavigate } from 'react-router-dom';
import { cardService } from '@/services/cardService';
import { useMemo } from 'react';
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

import DiscardDeck from '@/components/DiscardDeck/DiscardDeck.jsx';
// Hooks
import useWebSocket from '@/hooks/useGameWebSockets';
import useGameState from '@/hooks/useGameState';
import useGameData from '@/hooks/useGameData';
import useCardActions, { useSecrets } from '@/hooks/useCardActions';
import PlayerSelectionModal from '@/components/EventModals/PlayerSelectionModal';
import EventDisplay from '@/components/EventModals/EventDisplay';
import useSecretActions from '@/hooks/useSecretActions';

// Styles
import styles from './GamePage.module.css';

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
    disgracedPlayerIds, isLocalPlayerDisgraced, mySecretCards
  } = gameState;

  // Desarrollo solamente

  if (import.meta.env.DEV) {
    window.gameState = gameState;
  }

  const { handleOpenSecretsModal, handleCloseSecretsModal } = useSecrets(gameId, gameState);
  const { handleSetPlayedEvent, modals: detectiveModals } = useDetectiveSecretReveal(gameId, gameState, players);
  // Secret actions handlers used by SecretsModal
  const { handleSecretCardClick, handleRevealSecret, handleHideSecret, handleRobSecret } = useSecretActions(gameId, gameState);


  const webSocketCallbacks = {
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
      const { jugador_id: actorId, objetivo_id: targetId } = message;
      const actorName = gameState.players.find(p => p.id_jugador === actorId)?.nombre_jugador || 'Un jugador';
      const targetName = gameState.players.find(p => p.id_jugador === targetId)?.nombre_jugador || 'otro jugador';

      gameState.setEventCardInPlay({
        imageName: '18-event_anothervictim.png',
        message: `${actorName} robó un set de ${targetName}`
      });

      // Refrescar los sets para todos los jugadores
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
      const nuevaMano = message.data;

      const handWithInstanceIds = nuevaMano.map((card, index) => {
        console.log("Procesando carta:", card);
        return {
          ...card,
          instanceId: `${card.id}-update-${Date.now()}-${index}`,
          url: cardService.getCardImageUrl(card.id) // <--- agregar URL
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

    onDiscardUpdate: (discardPile) => gameState.setDiscardPile(discardPile),
  };

  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDraftCardClick, handleDiscard, handlePickUp, handlePlay, handleEventActionConfirm, handleOneMoreSecretSelect } = useCardActions(gameId, gameState);

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

      <div className={`${styles.bottomContainer} ${(gameState.isMyTurn && !isDrawingPhase) ? styles.myTurn : ''}`}>
        {isLocalPlayerDisgraced && <DisgraceOverlay />}
        <div className={styles.playerArea}>
          {/* Secret cards carousel */}
          <MySecretsCarousel secretCards={mySecretsForCarousel} />

          <div>
            <div data-testid="hand-container" className={styles.handContainer}>
              {sortedHand.map((card) => (
                <Card
                  key={card.instanceId}
                  imageName={card.url}
                  isSelected={selectedCards.includes(card.instanceId)}
                  onCardClick={() => handleCardClick(card.instanceId)}
                  subfolder="game-cards"
                />
              ))}
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
            ? players // Step 1: Show all players (including current player)
            : gameState.oneMoreStep === 3
            ? players.filter(p => p.id_jugador !== gameState.oneMoreSourcePlayer) // Step 3: All players except source
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

    </div>
  );
};
export default GamePage;