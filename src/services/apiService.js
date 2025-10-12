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

  const listGames = async (playerData) => {
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
    return request(`/partidas/${gameId}/robar?id_jugador=${playerId}&cantidad=${amount}` , {
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

  const getPlayerSecrets = async (gameId, playerId) => {
    return request(`/partidas/${gameId}/secretosjugador?id_jugador=${playerId}`, {
      method: "GET",
    });
  };
  const getDiscardPile = async (gameId, playerID, cantidad = 1)  => {
    return request(`/partidas/${gameId}/descarte?id_jugador=${playerID}&cantidad=${cantidad}`, {
      method: "GET",
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
    takeDraftCard,
    pickUpCards,
    getPlayerSecrets,
    getDiscardPile
  };
};

export const apiService = createHttpService();
