import { useParams, useNavigate } from 'react-router-dom';

// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
import PlayerPod from '@/components/PlayerPod/PlayerPod.jsx';

// Hooks
import useWebSocket  from '@/hooks/useGameWebSockets';
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
    roles, secretCards, displayedOpponents,
  } = gameState;


  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),
    onTurnUpdate: (turn) => gameState.setCurrentTurn(turn),
    onGameEnd: ({ winners, asesinoGano }) => {
      // Delegamos la resolución final de ganadores al modal
      gameState.setAsesinoGano(Boolean(asesinoGano));
      gameState.setWinners(Array.isArray(winners) ? winners : []);
    },
  };
  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDiscard } = useCardActions(gameId, gameState);

  // --- UI Helpers ---
  const getPlayerEmoji = gameState.getPlayerEmoji;

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

      {/* --- NEW WRAPPER for the central area --- */}
      <div className={styles.centerArea}>
        <Deck count={deckCount} />
        {/* Discard pile will go here later */}
      </div>

      <div className={`${styles.bottomContainer} ${gameState.isMyTurn ? styles.myTurn : ''}`}>
        
        {/* Player's hand and secrets go here */}
        <div className={styles.playerArea}>
          <div>
            <h2 className={styles.secretTitle}>Tus Secretos</h2>
            <div className={styles.secretCardsContainer}>
              {secretCards.map((card) => (
                <div key={card.instanceId} className={styles.secretCardWrapper}>
                  <Card imageName={card.url} subfolder="secret-cards" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h1 className={styles.title}>Tu Mano</h1>
            <div className={styles.handContainer}>
              {hand.map((card) => (
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
        </div>

        {/* The discard button is now INSIDE the bordered container */}
        <div className={styles.actionsContainer}>
          <button
            onClick={handleDiscard}
            disabled={!isDiscardButtonEnabled}
            className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
};
export default GamePage;