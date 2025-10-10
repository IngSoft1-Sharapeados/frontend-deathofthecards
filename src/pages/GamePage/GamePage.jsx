import { useParams, useNavigate } from 'react-router-dom';
import { cardService } from '@/services/cardService';
import { useMemo } from 'react';

// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import PlayerPod from '@/components/PlayerPod/PlayerPod.jsx';
import CardDraft from '@/components/CardDraft/CardDraft.jsx'

// Hooks
import useWebSocket from '@/hooks/useGameWebSockets';
import useGameState from '@/hooks/useGameState';
import useGameData from '@/hooks/useGameData';
import useCardActions from '@/hooks/useCardActions';

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
    isPlayButtonEnabled
  } = gameState;

  console.log("Testing Step 1 - Initial Game State:", gameState);


  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),
        onTurnUpdate: (turn) => {
      gameState.setCurrentTurn(turn);
      gameState.setPlayerTurnState('discarding'); 
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
  };

  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDraftCardClick, handleDiscard, handlePickUp, handlePlay } = useCardActions(gameId, gameState);

  const sortedHand = useMemo(() => {
    return [...hand].sort((a, b) => a.id - b.id);
  }, [hand]);
  const getPlayerEmoji = gameState.getPlayerEmoji;
  const isDrawingPhase = playerTurnState === 'drawing' && gameState.isMyTurn;
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
            />
          </div>
        ))}
      </div>

      <div className={styles.centerArea}>
        <Deck count={deckCount} isGlowing={isDrawingPhase} />
        <CardDraft
          cards={draftCards}
          selectedCards={selectedDraftCards}
          onCardClick={handleDraftCardClick}
          isGlowing={isDrawingPhase}
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

          {/* My played sets */}
          <div className={styles.mySetsContainer}>
            {(playedSetsByPlayer[currentPlayerId] || []).map((item, index) => {
              const card = cardService.getPlayingHand([{ id: item.representacion_id_carta }])[0];
              return (
                <div key={`myset-${index}`} className={styles.mySetCard}>
                  <Card imageName={card.url} subfolder="game-cards" />
                </div>
              );
            })}
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
            {playerTurnState === 'discarding' ? (
              <button
                onClick={handleDiscard}
                disabled={!isDiscardButtonEnabled}
                className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
              >
                Descartar
              </button>
            ) : (
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
    </div>
  );
};
export default GamePage;