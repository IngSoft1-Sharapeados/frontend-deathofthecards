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
import MySetsCarousel from '@/components/MySetsCarousel/MySetsCarousel.jsx';
import SetSelectionModal from '@/components/EventModals/SetSelectionModal';

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
    deckCount, currentTurn, turnOrder, players,
    winners, asesinoGano,
    isDiscardButtonEnabled, currentPlayerId,
    roles, secretCards, displayedOpponents, draftCards, discardPile,
    playerTurnState, selectedDraftCards, isPickupButtonEnabled,
    playedSetsByPlayer,
    isPlayButtonEnabled,
    isSecretsModalOpen, isSecretsLoading, playerSecretsData, viewingSecretsOfPlayer,
    playersSecrets, setPlayersSecrets,
    isPlayerSelectionModalOpen, eventCardToPlay, setEventCardInPlay, setPlayerSecretsData,
    canRevealSecrets, canHideSecrets, selectedSecretCard, canRobSecrets, isSetSelectionModalOpen
  } = gameState;
  // Desarrollo solamente
  if (process.env.NODE_ENV === 'development') {
    window.gameState = gameState;
  }
  const { handleOpenSecretsModal, handleCloseSecretsModal } = useSecrets(gameId, gameState);
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
      }
    },

    onSecretUpdate: ({ playerId, secrets }) => {
      const revealedCount = secrets.filter(s => s.revelado).length;
      const hiddenCount = secrets.length - revealedCount;
      setPlayersSecrets(prev => ({
        ...prev,
        [playerId]: { revealed: revealedCount, hidden: hiddenCount },
      }));
      //  Si el modal está abierto y mirando a este jugador, actualiza su lista
      if (viewingSecretsOfPlayer === playerId) {
        setPlayerSecretsData(
          secrets.map((s, index) => ({
            id: index,
            bocaArriba: s.revelado,
          }))
        );
      }
    },

    onDiscardUpdate: (discardPile) => gameState.setDiscardPile(discardPile),
  };

  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDraftCardClick, handleDiscard, handlePickUp, handlePlay, handleEventActionConfirm } = useCardActions(gameId, gameState);

  const sortedHand = useMemo(() => {
    return [...hand].sort((a, b) => a.id - b.id);
  }, [hand]);
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

      {/* --- Opponents Area --- */}
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
        <div className={styles.playerArea}>
          <div>
            <div className={styles.secretCardsContainer}>
              {secretCards.map((card) => (
                <div key={card.instanceId} className={styles.secretCardWrapper}>
                  <Card imageName={card.url} subfolder="secret-cards" />
                </div>
              ))}
            </div>
          </div>

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
        canHideSecrets={canHideSecrets}
        canRevealSecrets={canRevealSecrets}
        canRobSecrets={canRobSecrets}
        selectedSecret={selectedSecretCard}
        onSecretSelect={handleSecretCardClick}
        onRevealSecret={() => handleRevealSecret(viewingSecretsOfPlayer?.id_jugador)}
        onHideSecret={() => handleHideSecret(viewingSecretsOfPlayer?.id_jugador)}
        onRobSecret={() => handleRobSecret(viewingSecretsOfPlayer?.id_jugador)}
      />
      <PlayerSelectionModal
        isOpen={isPlayerSelectionModalOpen}
        onClose={() => gameState.setPlayerSelectionModalOpen(false)}
        players={opponentPlayers}
        onPlayerSelect={handleEventActionConfirm}
        title="Cards off the Table: Elige un jugador"
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