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
    return request(`/partidas?id_partida=${gameId}`, { 
      method: "PUT",
      body: JSON.stringify({ id_jugador: playerId }),
    }); 
  }; 
  return {
    createGame,
    listGames,
    joinGame,
    getGameDetails,
    startGame
  };
};

export const apiService = createHttpService();
