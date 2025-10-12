import { useParams, useNavigate } from 'react-router-dom';
import { cardService } from '@/services/cardService';
import { useMemo } from 'react';


// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import PlayerPod from '@/components/PlayerPod/PlayerPod.jsx';
import CardDraft from '@/components/CardDraft/CardDraft.jsx'
import SecretsModal from '@/components/SecretsModal/SecretsModal.jsx';
import MySetsCarousel from '@/components/MySetsCarousel/MySetsCarousel.jsx';


// Hooks
import useWebSocket from '@/hooks/useGameWebSockets';
import useGameState from '@/hooks/useGameState';
import useGameData from '@/hooks/useGameData';
import useCardActions, { useSecrets } from '@/hooks/useCardActions';

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
    roles, secretCards, displayedOpponents, draftCards,
    playerTurnState, selectedDraftCards, isPickupButtonEnabled,
    playedSetsByPlayer,
    isPlayButtonEnabled,
    isSecretsModalOpen, isSecretsLoading, playerSecretsData, viewingSecretsOfPlayer, playersSecrets, setPlayersSecrets

  } = gameState;

  const { handleOpenSecretsModal, handleCloseSecretsModal } = useSecrets(gameId, gameState);

  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),

        onTurnUpdate: (turn) => {
          gameState.setCurrentTurn(turn);
          gameState.setPlayerTurnState('discarding');
          // New rule: reset flag at the beginning of your turn
          gameState.setHasPlayedSetThisTurn(false);
        },
    

    onDraftUpdate: (newDraftData) => {
      const processedDraftCards = cardService.getDraftCards(newDraftData);
      const draftWithInstanceIds = processedDraftCards.map((card, index) => ({
        ...card,
        instanceId: `draft-${card.id}-${Date.now()}-${index}`
      }));
      gameState.setDraftCards(draftWithInstanceIds);
    },

    onGameEnd: ({ winners, asesinoGano }) => {
      gameState.setWinners(winners);
      gameState.setAsesinoGano(asesinoGano);
    },

    onSetPlayed: (payload) => {
      const { jugador_id, representacion_id, cartas_ids } = payload;
      gameState.setPlayedSetsByPlayer(prev => {
        const next = { ...prev };
        const arr = next[jugador_id] ? [...next[jugador_id]] : [];
        arr.push({ jugador_id, representacion_id_carta: representacion_id, cartas_ids });
        next[jugador_id] = arr;
        return next;
      });
    },


    onSecretUpdate: ({ playerId, secrets }) => {
      const revealedCount = secrets.filter(s => s.revelado).length;
      const hiddenCount = secrets.length - revealedCount;

      setPlayersSecrets(prevSecrets => ({
        ...prevSecrets,
        [playerId]: {
          revealed: revealedCount,
          hidden: hiddenCount,
        }
      }));
    },

  };

  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDraftCardClick, handleDiscard, handlePickUp, handlePlay } = useCardActions(gameId, gameState);

  const sortedHand = useMemo(() => {
    return [...hand].sort((a, b) => a.id - b.id);
  }, [hand]);
  const getPlayerEmoji = gameState.getPlayerEmoji;
  const isDrawingPhase = playerTurnState === 'drawing' && gameState.isMyTurn;

  // Also glow the deck/draft when a set was played and player can pick up to reach 6
  const canPickAfterSet = gameState.hasPlayedSetThisTurn && gameState.isMyTurn && hand.length < 6;
  console.log("ispickupenabled", isPickupButtonEnabled);
  console.log



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
        <Deck count={deckCount} isGlowing={isDrawingPhase || canPickAfterSet} />
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
      />
    </div>
  );
};
export default GamePage;