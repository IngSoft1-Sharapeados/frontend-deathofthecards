import { useState, useCallback } from 'react';

const useGameState = () => {
  // Estados de la UI y datos del jugador
  const [hand, setHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  // Estados globales del juego
  const [deckCount, setDeckCount] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [turnOrder, setTurnOrder] = useState([]);
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);
  const [roles, setRoles] = useState({ murdererId: null, accompliceId: null });
  const [secretCards, setSecretCards] = useState([]);

  // Estados para el fin de la partida
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);

  // Derived state
  const isMyTurn = currentTurn === currentPlayerId;
  const isDiscardButtonEnabled = selectedCards.length > 0 && isMyTurn;

  const getPlayerEmoji = (playerId) => {
    console.log("getPlayerEmoji()", { 
      currentPlayerId, 
      murdererId: roles.murdererId, 
      accompliceId: roles.accompliceId 
    });
    const isPlayerInvolved = currentPlayerId === roles.murdererId || currentPlayerId === roles.accompliceId;
    if (!isPlayerInvolved || !roles.murdererId) return null;
    if (playerId === roles.murdererId) return ' 🔪';
    if (playerId === roles.accompliceId) return ' 🤝';
    return null;
  };

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
    winners, setWinners,
    asesinoGano, setAsesinoGano,
    secretCards, setSecretCards,
    // Derived state
    isMyTurn,
    isDiscardButtonEnabled
  };
};

export default useGameState;