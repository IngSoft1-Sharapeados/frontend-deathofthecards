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
  const [mySecretCards, setMySecretCards] = useState([]);
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

  const [selectedSecretCard, setSelectedSecretCard] = useState(null);
  const [canRevealSecrets, setCanRevealSecrets] = useState(true);
  const [canHideSecrets, setCanHideSecrets] = useState(false); 
  const [canRobSecrets, setCanRobSecrets] = useState(true);

  const [isPlayerSelectionModalOpen, setPlayerSelectionModalOpen] = useState(false);
  const [isSetSelectionModalOpen, setSetSelectionModalOpen] = useState(false);
  const [eventCardToPlay, setEventCardToPlay] = useState(null);
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const [eventCardInPlay, setEventCardInPlay] = useState(null);
  const [disgracedPlayerIds, setDisgracedPlayerIds] = useState(new Set());



  // Derived state
  const isMyTurn = currentTurn === currentPlayerId;
  const isLocalPlayerDisgraced = disgracedPlayerIds.has(currentPlayerId);
  // Pickup is enabled while drawing, or if a set was already played this turn (to allow choosing pickup without discarding again),
  // but only when it's still your turn.
  const isPickupButtonEnabled = isMyTurn && (playerTurnState === 'drawing' || (hasPlayedSetThisTurn && hand.length < 6));
  const isPlayButtonEnabled = isMyTurn && !isLocalPlayerDisgraced && !hasPlayedSetThisTurn && playerTurnState === 'discarding' && (isValidDetectiveSet(hand, selectedCards) || isValidEventCard(hand, selectedCards));

  const maxSelect = (isLocalPlayerDisgraced) ? 1 : 6;
  const isDiscardButtonEnabled = selectedCards.length > 0 && selectedCards.length <= maxSelect && isMyTurn && playerTurnState === 'discarding';

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
    mySecretCards, setMySecretCards,
    draftCards, setDraftCards,

  playedSetsByPlayer, setPlayedSetsByPlayer,
  hasPlayedSetThisTurn, setHasPlayedSetThisTurn,
    discardPile,setDiscardPile,
    canRevealSecrets, setCanRevealSecrets,
    canHideSecrets, setCanHideSecrets,

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
    eventCardInPlay, setEventCardInPlay,
    isSetSelectionModalOpen, setSetSelectionModalOpen,
    disgracedPlayerIds, setDisgracedPlayerIds,
    isConfirmationModalOpen, setConfirmationModalOpen,
    isLocalPlayerDisgraced
  };
};

export default useGameState;