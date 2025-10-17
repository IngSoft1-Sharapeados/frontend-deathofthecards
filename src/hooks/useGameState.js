import { useState, useCallback, useMemo } from 'react';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';
import { isValidEventCard } from '@/utils/eventCardValidation';


const useGameState = () => {
  // Estados de la UI y datos del jugador
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [discardPile, setDiscardPile] = useState([]);

  // Estados globales del juego
  const [deckCount, setDeckCount] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [turnOrder, setTurnOrder] = useState([]);
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);
  const [roles, setRoles] = useState({ murdererId: null, accompliceId: null });
  const [secretCards, setSecretCards] = useState([]);
  const [draftCards, setDraftCards] = useState([]);
  const [playedSetsByPlayer, setPlayedSetsByPlayer] = useState({});
  // Track if player has played a set in the current turn
  const [hasPlayedSetThisTurn, setHasPlayedSetThisTurn] = useState(false);

  // Estados para el fin de la partida
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);

  const [playerTurnState, setPlayerTurnState] = useState('discarding');
  const [selectedDraftCards, setSelectedDraftCards] = useState([]);

  // Estado de los secretos
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
  const [viewingSecretsOfPlayer, setViewingSecretsOfPlayer] = useState(null);
  const [playerSecretsData, setPlayerSecretsData] = useState([]);
  const [isSecretsLoading, setIsSecretsLoading] = useState(false);
  const [playersSecrets, setPlayersSecrets] = useState({});

  const [isPlayerSelectionModalOpen, setPlayerSelectionModalOpen] = useState(false);
  const [eventCardToPlay, setEventCardToPlay] = useState(null);

  const [eventCardInPlay, setEventCardInPlay] = useState(null);


  // Derived state
  const isMyTurn = currentTurn === currentPlayerId;
  const isDiscardButtonEnabled = selectedCards.length > 0 && isMyTurn && playerTurnState === 'discarding';
  // Pickup is enabled while drawing, or if a set was already played this turn (to allow choosing pickup without discarding again),
  // but only when it's still your turn.
  const isPickupButtonEnabled = isMyTurn && (playerTurnState === 'drawing' || (hasPlayedSetThisTurn && hand.length < 6));
  const isPlayButtonEnabled = isMyTurn && !hasPlayedSetThisTurn && playerTurnState === 'discarding' && (isValidDetectiveSet(hand, selectedCards) || isValidEventCard(hand, selectedCards)) ;


  const getPlayerEmoji = (playerId) => {

    const isPlayerInvolved = currentPlayerId === roles.murdererId || currentPlayerId === roles.accompliceId;
    if (!isPlayerInvolved || !roles.murdererId) return null;
    if (playerId === roles.murdererId) return ' 🔪';
    if (playerId === roles.accompliceId) return ' 🤝';
    return null;
  };

  // Jugadores oponentes ordenados para visualización (desde tu derecha)
  const displayedOpponents = useMemo(() => {
    const playerIndex = turnOrder.indexOf(currentPlayerId);
    if (playerIndex === -1) return [];

    const rotatedTurnOrder = [
      ...turnOrder.slice(playerIndex + 1),
      ...turnOrder.slice(0, playerIndex)
    ];

    return rotatedTurnOrder
      .reverse()
      .map((playerId) => players.find((p) => p.id_jugador === playerId))
      .filter(Boolean);
  }, [turnOrder, currentPlayerId, players]);

  return {
    // Estado
    hand, setHand,
    selectedCards, setSelectedCards,
    isLoading, setIsLoading,
    currentPlayerId, setCurrentPlayerId,
    deckCount, setDeckCount,
    currentTurn, setCurrentTurn,
    turnOrder, setTurnOrder,
    players, setPlayers,
    hostId, setHostId,
    roles, setRoles,
    getPlayerEmoji,
    displayedOpponents,
    winners, setWinners,
    asesinoGano, setAsesinoGano,
    secretCards, setSecretCards,
    draftCards, setDraftCards,
    // Derived state

    playedSetsByPlayer, setPlayedSetsByPlayer,
    hasPlayedSetThisTurn, setHasPlayedSetThisTurn,
    discardPile, setDiscardPile,
    // Derived state
    isMyTurn,
    isDiscardButtonEnabled,
    isPickupButtonEnabled,
    isPlayButtonEnabled,
    playerTurnState, setPlayerTurnState,
    selectedDraftCards, setSelectedDraftCards,
    isSecretsModalOpen, setIsSecretsModalOpen,
    viewingSecretsOfPlayer, setViewingSecretsOfPlayer,
    playerSecretsData, setPlayerSecretsData,
    isSecretsLoading, setIsSecretsLoading,
    playersSecrets, setPlayersSecrets,
    isPlayerSelectionModalOpen, setPlayerSelectionModalOpen,
    eventCardToPlay, setEventCardToPlay,
    eventCardInPlay, setEventCardInPlay
  };
};

export default useGameState;