import { useParams, useNavigate } from 'react-router-dom';

// Components
import Card from '@/components/Card/Card';
import Deck from '@/components/Deck/Deck.jsx';
import GameOverScreen from '@/components/GameOver/GameOverModal.jsx';
//hooks
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
    deckCount, currentTurn, turnOrder, players, hostId,
    winners, asesinoGano,
    isDiscardButtonEnabled, currentPlayerId,
    roles, secretCards,
  } = gameState;

  // --- WebSocket Callbacks ---
  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),
    onTurnUpdate: (turn) => gameState.setCurrentTurn(turn),
    onGameEnd: ({ winners, asesinoGano }) => {
      gameState.setWinners(winners);
      gameState.setAsesinoGano(asesinoGano);
    }
  };
  // Usar el custom hook solo para manejar eventos
  useWebSocket(webSocketCallbacks);

  // --- Data Loading y coneccion a WS ---
  useGameData(gameId, gameState);

  // --- Card Actions ---
  const cardActions = useCardActions(gameId, gameState);
  const { handleCardClick, handleDiscard } = cardActions;

  const getPlayerEmoji = (playerId) => {
    const isPlayerInvolved = currentPlayerId === roles.murdererId || currentPlayerId === roles.accompliceId;
    console.log("esta involucrado?", isPlayerInvolved, "Jugador ID:", playerId, "Roles:", roles, "Jugador actual ID:", currentPlayerId);

    if (!isPlayerInvolved || !roles.murdererId) {
      return null;
    }

    if (playerId === roles.murdererId) {
      return ' 🔪';
    }
    if (playerId === roles.accompliceId) {
      return ' 🤝';
    }

    return null; 
  };

  if (isLoading) {
    return <div className={styles.loadingSpinner}></div>;
  }

  return (
    <div className={styles.gameContainer}>
      {winners && (
        <GameOverScreen
          winners={winners}
          asesinoGano={asesinoGano}
          onReturnToMenu={() => navigate("/")}
        />
      )}

      {/* Deck */}
      <div className={styles.deckContainer}>
        <Deck count={deckCount} />
      </div>

      {/* Área del jugador */}
      <div className={styles.playerArea}>

        {/* Contenedor de Secretos */}
        <div>
          <h2 className={styles.secretTitle}>Tus Secretos</h2>
          <div className={styles.secretCardsContainer}>
            {secretCards.map((card) => (
              <div key={card.instanceId} className={styles.secretCardWrapper}>
                <Card
                  imageName={card.url}
                  subfolder="secret-cards"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contenedor de la Mano */}
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

      {/* Contenedor de Acciones */}
      <div className={styles.actionsContainer}>
        <button
          onClick={handleDiscard}
          disabled={!isDiscardButtonEnabled}
          className={`${styles.discardButton} ${isDiscardButtonEnabled ? styles.enabled : ''}`}
        >
          Descartar
        </button>
      </div>

      {/* Tabla de jugadores */}
      {turnOrder.length > 0 && players.length > 0 && (
        <div className={styles.playersTableContainer}>
          <h2 className={styles.playersTableTitle}>Jugadores ({players.length})</h2>
          <table className={styles.playersTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {turnOrder.map((playerId, idx) => {
                const player = players.find(p => p.id_jugador === playerId);
                if (!player) return null;

                const nameClasses = [
                  player.id_jugador === hostId ? styles.hostName : '',
                  player.id_jugador === currentPlayerId ? styles.currentUserName : ''
                ].join(' ');

                return (
                  <tr
                    key={player.id_jugador}
                    className={player.id_jugador === currentTurn ? styles.currentPlayerRow : ''}
                  >
                    <td>{idx + 1}</td>
                    <td className={nameClasses}>
                      {player.nombre_jugador}
                      <span> {getPlayerEmoji(player.id_jugador)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GamePage;
