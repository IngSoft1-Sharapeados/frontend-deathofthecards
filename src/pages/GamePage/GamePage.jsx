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
import { apiService } from '@/services/apiService';
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
    roles, getPlayerEmoji, secretCards,
  } = gameState;

  // Utilidad para resolver nombres de ganadores según roles actuales
  const resolveWinners = (rolesObj, playersList) => {
    if (!rolesObj || !rolesObj.murdererId) return null;
    const murderer = playersList.find(p => p.id_jugador === rolesObj.murdererId);
    const accomplice = rolesObj.accompliceId
      ? playersList.find(p => p.id_jugador === rolesObj.accompliceId)
      : null;
    const names = [];
    if (murderer?.nombre_jugador) names.push(murderer.nombre_jugador);
    if (accomplice?.nombre_jugador) names.push(accomplice.nombre_jugador);
    return names.length ? names : null;
  };

  // --- WebSocket Callbacks ---
  const webSocketCallbacks = {
    onDeckUpdate: (count) => gameState.setDeckCount(count),
    onTurnUpdate: (turn) => gameState.setCurrentTurn(turn),
    onGameEnd: async (_payload) => {
      // Ignoramos 'winners' del payload y resolvemos con el estado/roles actuales
      let computed = resolveWinners(roles, players);
      if (!computed) {
        try {
          // Fallback: obtener roles desde el backend y recalcular
          const rolesData = await apiService.getRoles(gameId);
          const fetchedRoles = {
            murdererId: rolesData?.["asesino-id"] ?? null,
            accompliceId: rolesData?.["complice-id"] ?? null,
          };
          computed = resolveWinners(fetchedRoles, players) || [];
          // Guardamos roles si no estaban
          if (!roles?.murdererId && fetchedRoles.murdererId) {
            gameState.setRoles(fetchedRoles);
          }
        } catch (e) {
          console.error('No se pudieron obtener roles al finalizar partida:', e);
          computed = [];
        }
      }
      gameState.setWinners(computed);
      gameState.setAsesinoGano(true);
    }
  };
  // Usar el custom hook solo para manejar eventos
  useWebSocket(webSocketCallbacks);

  // --- Data Loading y coneccion a WS ---
  useGameData(gameId, gameState);

  // --- Card Actions ---
  const cardActions = useCardActions(gameId, gameState);
  const { handleCardClick, handleDiscard } = cardActions;


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
