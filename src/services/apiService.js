const createHttpService = () => {
  const baseUrl = import.meta.env.VITE_SERVER_URI || 'http://localhost:8000';

  const request = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}`);
    }
    return response.json();
  };

  // Aca van nuestros servicios
  const createGame = async (gameData) => {
    return request("/partidas", {
      method: "POST",
      body: JSON.stringify(gameData),
    });
  };

  const listGames = async () => {
    return request("/partidas", {
      method: "GET",
    });
  };

  const joinGame = async (gameId, playerData) => {
    return request(`/partidas/${gameId}`, {
      method: "POST",
      body: JSON.stringify(playerData),
    });
  }

  const getGameDetails = async (gameId) => {
    return request(`/partidas/${gameId}`, {
      method: "GET",
    });
  }

  const startGame = async (gameId, playerId) => {
    const gameIdInt = parseInt(gameId, 10);

    return request(`/partidas/${gameIdInt}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_jugador: playerId }),
    });
  };


  const discardCards = async (gameId, playerId, cardIds) => {
    return request(`/partidas/${gameId}/descarte/?id_jugador=${playerId}`, {
      method: "PUT",
      body: JSON.stringify(cardIds),
    });
  };


  const getHand = async (gameId, playerId) => {
    return request(`/partidas/${gameId}/mano/?id_jugador=${playerId}`, {
      method: "GET",
    });
  }

  const getTurn = async (gameId) => {
    return request(`/partidas/${gameId}/turno`, {
      method: "GET",
    });
  }


  const getDeckCount = async (gameId) => {
    return request(`/partidas/${gameId}/mazo`, {
      method: "GET",
    });
  }

  const getTurnOrder = async (gameId) => {
    return request(`/partidas/${gameId}/turnos`, { method: "GET" });
  };

  const drawCards = async (gameId, playerId, amount = 1) => {
    return request(`/partidas/${gameId}/robar?id_jugador=${playerId}&cantidad=${amount}`, {
      method: "POST",
    });
  };

  const getMySecrets = async (gameId, playerId) => {
    return request(`/partidas/${gameId}/secretos?id_jugador=${playerId}`, {
      method: "GET",
    });
  }

  const getRoles = async (gameId) => {
    return request(`/partidas/${gameId}/roles`, {
      method: "GET",
    });
  }

  const getDraftCards = async (gameId) => {
    return request(`/partidas/${gameId}/draft`, {
      method: "GET",
    });
  }

  const getPlayedSets = async (gameId) => {
    return request(`/partidas/${gameId}/sets`, {
      method: "GET",
    });
  }

  const takeDraftCard = async (gameId, playerId, cardIds) => {
    return request(`/partidas/${gameId}/draft?id_jugador=${playerId}`, {
      method: "PUT",
      body: JSON.stringify(cardIds), // The backend expects a list of integers
    });
  };

  const pickUpCards = async (gameId, playerId, draftCardIds) => {
    const payload = {
      cartas_draft: draftCardIds
    };
    return request(`/partidas/${gameId}/jugador/${playerId}/recoger`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  };

  const playDetectiveSet = async (gameId, playerId, cardIds) => {
    // Backend expects: POST /partidas/{id_partida}/Jugar-set?id_jugador=... body: [int, int, int]
    return request(`/partidas/${gameId}/Jugar-set?id_jugador=${playerId}`, {
      method: "POST",
      body: JSON.stringify(cardIds),
    });
  };

  const getPlayerSecrets = async (gameId, playerId) => {
    return request(`/partidas/${gameId}/secretosjugador?id_jugador=${playerId}`, {
      method: "GET",
    });
  };

  const revealSecret = async (gameId, actingPlayerId, secretUniqueId) => {
    // Revelar secreto: ahora el backend espera id_jugador_turno (jugador que ejecuta la acción)
    return request(`/partidas/${gameId}/revelacion?id_jugador_turno=${actingPlayerId}&id_unico_secreto=${secretUniqueId}`, {
      method: "PATCH",
    });
  };
  const hideSecret = async (gameId, actingPlayerId, secretUniqueId) => {
    // Ocultar secreto: el backend espera id_jugador_turno
    return request(`/partidas/${gameId}/ocultamiento?id_jugador_turno=${actingPlayerId}&id_unico_secreto=${secretUniqueId}`, {
      method: 'PATCH',
    });
  };
  const revealOwnSecret = async (gameId, playerId, secretUniqueId) => {
    // Revelación propia cambió a /revelacion-propia y usa id_jugador
    return request(`/partidas/${gameId}/revelacion-propia?id_jugador=${playerId}&id_unico_secreto=${secretUniqueId}`, {
      method: 'PATCH',
    });
  };
  const requestTargetToRevealSecret = async (gameId, requesterId, targetPlayerId, motivo = 'lady-brent') => {
    return request(`/partidas/${gameId}/solicitar-revelacion?id_jugador_solicitante=${requesterId}&id_jugador_objetivo=${targetPlayerId}&motivo=${encodeURIComponent(motivo)}`, {
      method: 'POST',
    });

  };
  const getDiscardPile = async (gameId, playerID, cantidad = 1) => {
    return request(`/partidas/${gameId}/descarte?id_jugador=${playerID}&cantidad=${cantidad}`, {
      method: "GET",
    });
  };

  const robSecret = async (gameId, playerIdTurno, targetPlayerId, secretUniqueId) => {
    return request(`/partidas/${gameId}/robo-secreto?id_jugador_turno=${playerIdTurno}&id_jugador_destino=${targetPlayerId}&id_unico_secreto=${secretUniqueId}`,
    { method: 'PATCH' });
  };
  


  const playCardsOffTheTable = async (gameId, playerId, targetId, cardId) => {
    return request(`/partidas/${gameId}/evento/CardsTable?id_jugador=${playerId}&id_objetivo=${targetId}&id_carta=${cardId}`, {
      method: "PUT",
    });
  };

  const playAnotherVictim = async (gameId, playerId, cardId, targetSet) => {
    return request(`/partidas/${gameId}/evento/AnotherVictim?id_jugador=${playerId}&id_carta=${cardId}`, {
      method: "PUT",
      body: JSON.stringify({
        id_objetivo: targetSet.jugador_id,
        id_representacion_carta: targetSet.representacion_id_carta,
        ids_cartas: targetSet.cartas_ids
      }),
    });
  };

  const playDelayTheMurdererEscape = async (gameId, playerId, cardId, amount) => {
    return request(`/partidas/${gameId}/evento/DelayMurderer?id_jugador=${playerId}&id_carta=${cardId}&cantidad=${amount}`, {
      method: "PUT",
    });
  };


  return {
    createGame,
    listGames,
    joinGame,
    getGameDetails,
    startGame,
    discardCards,
    getHand,
    getTurn,
    getDeckCount,
    getTurnOrder,
    drawCards,
    getMySecrets,
    getRoles,
    getDraftCards,

    requestTargetToRevealSecret,

    takeDraftCard,
    pickUpCards,
    playDetectiveSet,
    getPlayedSets,
    getPlayerSecrets,
    getDiscardPile,
    playCardsOffTheTable,
    revealSecret,
    hideSecret,
    revealOwnSecret,
    robSecret,
    playAnotherVictim,
    playDelayTheMurdererEscape
  };
};

export const apiService = createHttpService();
