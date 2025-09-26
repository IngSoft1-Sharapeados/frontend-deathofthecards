const createHttpService = () => {
  const baseUrl = import.meta.env.VITE_SERVER_URI || 'http://localhost:8000';

  const request = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await response.json();
    } catch (error) {
      console.error('API request fail: ', error);
      return { error: true, message: error.message }; 
    }
  };

  // Aca van nuestros servicios
  const createGame = async (gameData) => {
    return request("/partidas", {
      method: "POST",
      body: JSON.stringify(gameData),
    });
  };  

  return {
    createGame,
  };
};

export const apiService = createHttpService();
