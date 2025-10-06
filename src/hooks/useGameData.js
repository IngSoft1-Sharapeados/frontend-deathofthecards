import { useEffect, useRef } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import websocketService from '@/services/websocketService';

const useGameData = (gameId, gameState) => {
  const {
    setHand, setIsLoading, setCurrentPlayerId,
    setDeckCount, setCurrentTurn, setTurnOrder, 
    setPlayers, setHostId, setWinners, setAsesinoGano
  } = gameState;

  const hasConnectedRef = useRef(false); // evita reconexiones extras
  
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(parseInt(storedPlayerId, 10));
    }

    const loadGameData = async () => {
      if (gameId && storedPlayerId) {
        try {
          const [handData, turnData, deckData, turnOrderData, gameData] = await Promise.all([
            apiService.getHand(gameId, storedPlayerId),
            apiService.getTurn(gameId),
            apiService.getDeckCount(gameId),
            apiService.getTurnOrder(gameId),
            apiService.getGameDetails(gameId)
          ]);

          // Actualizar estado del juego
          setDeckCount(deckData);
          if (deckData === 0) {
            setWinners(["Nadie"]);
            setAsesinoGano(false);
          }
          setCurrentTurn(turnData);
          setTurnOrder(turnOrderData);
          setHostId(gameData.id_anfitrion);
          setPlayers(gameData.listaJugadores || []);
          
          // Procesar mano de cartas
          const playingHand = cardService.getPlayingHand(handData);
          const handWithInstanceIds = playingHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-${index}`
          }));
          setHand(handWithInstanceIds);

          // Conectar WebSocket solo una vez
          if (!hasConnectedRef.current) {
            console.log('🔌 Conectando WebSocket...', { gameId, playerId: storedPlayerId });
            websocketService.connect(gameId, storedPlayerId);
            hasConnectedRef.current = true;
          }

        } catch (error) {
          console.error("Error al cargar los datos del juego:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGameData();
  }, [gameId]);
};

export default useGameData;