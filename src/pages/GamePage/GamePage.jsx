import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react'; // Import useMemo

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
    roles, secretCards,
  } = gameState;

  // --- Reorder players for display ---
  // This logic ensures players are always shown in turn order starting from your right
  const displayedOpponents = useMemo(() => {
    const playerIndex = turnOrder.indexOf(currentPlayerId);
    if (playerIndex === -1) return [];

    const rotatedTurnOrder = [
      ...turnOrder.slice(playerIndex + 1),
      ...turnOrder.slice(0, playerIndex)
    ];

    return rotatedTurnOrder.reverse()
      .map(playerId => players.find(p => p.id_jugador === playerId))
      .filter(Boolean);
  }, [turnOrder, currentPlayerId, players]);


  // (The WebSocket, Data, and Card Action hooks remain unchanged)
  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),
    onTurnUpdate: (turn) => gameState.setCurrentTurn(turn),
    onGameEnd: ({ winners, asesinoGano }) => {
      gameState.setWinners(winners);
      gameState.setAsesinoGano(asesinoGano);
    }
  };
  useWebSocket(webSocketCallbacks);
  useGameData(gameId, gameState);
  const { handleCardClick, handleDiscard } = useCardActions(gameId, gameState);

  // --- UI Logic ---
  const getPlayerEmoji = (playerId) => {
    const isPlayerInvolved = currentPlayerId === roles.murdererId || currentPlayerId === roles.accompliceId;
    if (!isPlayerInvolved || !roles.murdererId) return null;
    if (playerId === roles.murdererId) return '🔪';
    if (playerId === roles.accompliceId) return '🤝';
    return null;
  };

  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

  return (
    <div className={styles.gameContainer}>
      {winners && (
        <GameOverScreen winners={winners} asesinoGano={asesinoGano} onReturnToMenu={() => navigate("/")} />
      )}

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
        <Deck count={deckCount} />
        <CardDraft />
      </div>

      <div className={`${styles.bottomContainer} ${gameState.isMyTurn ? styles.myTurn : ''}`}>
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
    </div>
  );
};
export default GamePage;