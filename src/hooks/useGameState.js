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

  // Estados para el fin de la partida
  const [winners, setWinners] = useState(null);
  const [asesinoGano, setAsesinoGano] = useState(false);

  // Derived state
  const isMyTurn = currentTurn === currentPlayerId;
  const isDiscardButtonEnabled = selectedCards.length > 0 && isMyTurn;

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
    winners, setWinners,
    asesinoGano, setAsesinoGano,
    
    // Derived state
    isMyTurn,
    isDiscardButtonEnabled
  };
};

export default useGameState;