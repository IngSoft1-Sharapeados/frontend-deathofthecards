import { useEffect, useRef } from 'react';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';
import websocketService from '@/services/websocketService';

const useGameData = (gameId, gameState) => {
  const {
    setHand, setIsLoading, setCurrentPlayerId,
    setDeckCount, setCurrentTurn, setTurnOrder,
    setPlayers, setHostId, setWinners, setAsesinoGano,
    setRoles, setSecretCards, setDraftCards,
  } = gameState;

  const hasConnectedRef = useRef(false); // evita reconexiones extras

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (!storedPlayerId) {
      console.error(' No playerId found in sessionStorage');
      setIsLoading(false);
      return;
    }

    setCurrentPlayerId(parseInt(storedPlayerId, 10));

    const loadGameData = async () => {
      if (gameId && storedPlayerId) {
        try {
          const [handData, turnData, deckData, turnOrderData, gameData, rolesData, secretCardsData, draftData] = await Promise.all([
            apiService.getHand(gameId, storedPlayerId),
            apiService.getTurn(gameId),
            apiService.getDeckCount(gameId),
            apiService.getTurnOrder(gameId),
            apiService.getGameDetails(gameId),
            apiService.getRoles(gameId),
            apiService.getMySecrets(gameId, storedPlayerId),
            apiService.getDraftCards(gameId),
          ]);


          // Actualizar estado del juego
          setDeckCount(deckData);
          setCurrentTurn(turnData);
          setTurnOrder(turnOrderData);
          setHostId(gameData.id_anfitrion);
          setPlayers(gameData.listaJugadores || []);

          if (rolesData) {
            setRoles({
              murdererId: rolesData["asesino-id"],
              accompliceId: rolesData["complice-id"]
            });
          }

          // Si el mazo ya está en 0 al cargar, computar ganadores según roles
          if (deckData === 0) {
            const playersList = gameData.listaJugadores || [];
            const murderer = rolesData?.["asesino-id"]
              ? playersList.find(p => p.id_jugador === rolesData["asesino-id"]) : null;
            const accomplice = rolesData?.["complice-id"]
              ? playersList.find(p => p.id_jugador === rolesData["complice-id"]) : null;
            const names = [];
            if (murderer?.nombre_jugador) names.push(murderer.nombre_jugador);
            if (accomplice?.nombre_jugador) names.push(accomplice.nombre_jugador);
            setWinners(names.length ? names : ["Nadie"]);
            setAsesinoGano(names.length > 0);
          }

          const draftHand = cardService.getDraftCards(draftData);
          const draftWithInstanceIds = draftHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-draft-${index}`,
          }));
          setDraftCards(draftWithInstanceIds);

          const secretHand = cardService.getSecretCards(secretCardsData);
          const secretsWithInstanceIds = secretHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-secret-${index}`
          }));
          setSecretCards(secretsWithInstanceIds);

          // Procesar mano de cartas
          const playingHand = cardService.getPlayingHand(handData);
          const handWithInstanceIds = playingHand.map((card, index) => ({
            ...card,
            instanceId: `${card.id}-${index}`
          }));
          setHand(handWithInstanceIds);

          // Conectar WebSocket solo una vez
          if (!hasConnectedRef.current) {
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