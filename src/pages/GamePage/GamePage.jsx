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
    playerTurnState, selectedDraftCards, isPickupButtonEnabled
  } = gameState;

  console.log("Testing Step 1 - Initial Game State:", gameState);


  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),
        onTurnUpdate: (turn) => {
      gameState.setCurrentTurn(turn);
      gameState.setPlayerTurnState('discarding'); 
    },
    
    onDraftUpdate: (newDraftData) => {
      const processedDraftCards = cardService.getPlayingHand(newDraftData);
      const draftWithInstanceIds = processedDraftCards.map((card, index) => ({
        ...card,
        instanceId: `draft-${card.id}-${Date.now()}-${index}`
      }));
      gameState.setDraftCards(draftWithInstanceIds);
    },
    
    onGameEnd: ({ winners, asesinoGano }) => {
      gameState.setWinners(winners);
      gameState.setAsesinoGano(asesinoGano);
    }
  };

  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDraftCardClick, handleDiscard, handlePickUp } = useCardActions(gameId, gameState);

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

          <div className={styles.actionsContainer}>
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