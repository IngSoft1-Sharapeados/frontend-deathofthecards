import { useState, useCallback, useMemo } from 'react';
import { isValidDetectiveSet, canAddCardToSet } from '@/utils/detectiveSetValidation';
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
  const [turnStartedAt, setTurnStartedAt] = useState(false);
  const [isAddToSetModalOpen, setAddToSetModalOpen] = useState(false);

  // Estados para el fin de la partida
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);
  const [isDisgraceVictory, setIsDisgraceVictory] = useState(false);

  const [playerTurnState, setPlayerTurnState] = useState('discarding');
  const [selectedDraftCards, setSelectedDraftCards] = useState([]);

  // Estado de los secretos
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
  const [viewingSecretsOfPlayer, setViewingSecretsOfPlayer] = useState(null);
  const [playerSecretsData, setPlayerSecretsData] = useState([]);
  const [isSecretsLoading, setIsSecretsLoading] = useState(false);
  const [playersSecrets, setPlayersSecrets] = useState({});

  const [selectedSecretCard, setSelectedSecretCard] = useState(null);
  const [canRevealSecrets, setCanRevealSecrets] = useState(false);
  const [canHideSecrets, setCanHideSecrets] = useState(false);
  const [canRobSecrets, setCanRobSecrets] = useState(false);

  const [isPlayerSelectionModalOpen, setPlayerSelectionModalOpen] = useState(false);
  const [isSetSelectionModalOpen, setSetSelectionModalOpen] = useState(false);
  const [eventCardToPlay, setEventCardToPlay] = useState(null);
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const [eventCardInPlay, setEventCardInPlay] = useState(null);
  const [disgracedPlayerIds, setDisgracedPlayerIds] = useState(new Set());

  // Estados para OneMore event flow
  const [oneMoreStep, setOneMoreStep] = useState(0); // 0: not active, 1: select source, 2: select secret, 3: select destination
  const [oneMoreSourcePlayer, setOneMoreSourcePlayer] = useState(null);
  const [oneMoreSelectedSecret, setOneMoreSelectedSecret] = useState(null);
  const [oneMoreDestinationPlayer, setOneMoreDestinationPlayer] = useState(null);

  // estados de look in to the ashes
  const [lookIntoAshesModalOpen, setLookIntoAshesModalOpen] = useState(false);
  const [discardPileSelection, setDiscardPileSelection] = useState([]);
  const [selectedDiscardCard, setSelectedDiscardCard] = useState(null);

  const [isPysVotingModalOpen, setIsPysVotingModalOpen] = useState(false);
  const [pysActorId, setPysActorId] = useState(null); // Quién jugó la carta
  const [pysLoadingMessage, setPysLoadingMessage] = useState(null); // "Esperando votos..."
  const [pysVotos, setPysVotos] = useState({});

  const [isCardTradeModalOpen, setCardTradeModalOpen] = useState(false);
  const [cardTradeContext, setCardTradeContext] = useState(null);
  const [isDeadCardFollyModalOpen, setDeadCardFollyModalOpen] = useState(false);
  // Derived state
  const isMyTurn = currentTurn === currentPlayerId;
  const isLocalPlayerDisgraced = disgracedPlayerIds.has(currentPlayerId);
  // Pickup is enabled while drawing, or if a set was already played this turn (to allow choosing pickup without discarding again),
  const isPickupButtonEnabled = isMyTurn && (playerTurnState === 'drawing' || (hasPlayedSetThisTurn && hand.length < 6));

  const isAriadneSelected = (() => {
    if (!Array.isArray(hand) || !Array.isArray(selectedCards) || selectedCards.length !== 1) return false;
    const card = hand.find(c => c.instanceId === selectedCards[0]);
    return card?.id === 15;
  })();

  const myPlayedSets = useMemo(() => {
    return playedSetsByPlayer[currentPlayerId] || [];
  }, [playedSetsByPlayer, currentPlayerId]);

  // Comprueba si la carta seleccionada se puede añadir a un set existente
  const canPlaySingleDetective = useMemo(() => {
    return canAddCardToSet(hand, selectedCards, myPlayedSets);
  }, [hand, selectedCards, myPlayedSets]);

  const isPlayButtonEnabled = useMemo(() => {
    // Condiciones de bloqueo:
    if (!isMyTurn ||
      isLocalPlayerDisgraced || // No puedes jugar si estás en desgracia
      hasPlayedSetThisTurn ||    // No puedes jugar si ya jugaste un set/evento
      playerTurnState !== 'discarding' 
    ) {
      return false;
    }

    // Condiciones de habilitación:
    const isEvent = isValidEventCard(hand, selectedCards);
    const isSet = isValidDetectiveSet(hand, selectedCards);

    // Comprobar si es un evento, un set, Ariadne, O si se puede añadir a un set
    return isEvent || isSet || isAriadneSelected || canPlaySingleDetective;

  }, [
    isMyTurn, isLocalPlayerDisgraced, playerTurnState, hasPlayedSetThisTurn,
    hand, selectedCards, isAriadneSelected, canPlaySingleDetective
  ]);



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
    isDisgraceVictory, setIsDisgraceVictory,
    mySecretCards, setMySecretCards,
    draftCards, setDraftCards,

    playedSetsByPlayer, setPlayedSetsByPlayer,
    hasPlayedSetThisTurn, setHasPlayedSetThisTurn,
    discardPile, setDiscardPile,
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

    selectedSecretCard, setSelectedSecretCard,
    canRobSecrets, setCanRobSecrets,

    // OneMore event states
    oneMoreStep, setOneMoreStep,
    oneMoreSourcePlayer, setOneMoreSourcePlayer,
    oneMoreSelectedSecret, setOneMoreSelectedSecret,
    oneMoreDestinationPlayer, setOneMoreDestinationPlayer,

    disgracedPlayerIds, setDisgracedPlayerIds,
    isConfirmationModalOpen, setConfirmationModalOpen,
    isLocalPlayerDisgraced,
    lookIntoAshesModalOpen, setLookIntoAshesModalOpen,
    discardPileSelection, setDiscardPileSelection,
    selectedDiscardCard, setSelectedDiscardCard,
    isAddToSetModalOpen, setAddToSetModalOpen,
    canPlaySingleDetective,
    isPysVotingModalOpen, setIsPysVotingModalOpen,
    turnStartedAt, setTurnStartedAt,
    pysActorId, setPysActorId,
    pysLoadingMessage, setPysLoadingMessage,
    pysVotos, setPysVotos, isMyTurn,
    isCardTradeModalOpen, setCardTradeModalOpen,
    cardTradeContext, setCardTradeContext,
    isDeadCardFollyModalOpen, setDeadCardFollyModalOpen,
  };
};

export default useGameState;