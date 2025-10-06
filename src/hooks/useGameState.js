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

  // Reset del estado (útil para reiniciar)
  const resetGameState = useCallback(() => {
    setHand([]);
    setSelectedCards([]);
    setIsLoading(true);
    setCurrentPlayerId(null);
    setDeckCount(0);
    setCurrentTurn(null);
    setTurnOrder([]);
    setPlayers([]);
    setHostId(null);
    setWinners(null);
    setAsesinoGano(false);
  }, []);

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
    isDiscardButtonEnabled,
    
    // Actions
    resetGameState
  };
};

export default useGameState;