let socket = null;
const eventHandlers = {
  'union-jugador': [],
  'iniciar-partida': [],
  'actualizacion-mazo': [],
  'turno-actual': [],
};

const websocketService = {
  connect(gameId, playerId) {

    const wsURL = `ws://localhost:8000/partidas/ws/${gameId}/${playerId}`;
    
    socket = new WebSocket(wsURL);

    socket.onopen = () => {
      console.log('WebSocket conectado exitosamente.');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Mensaje recibido:', message);

        if (message.evento && eventHandlers[message.evento]) {
          eventHandlers[message.evento].forEach(callback => callback(message));
        }
      } catch (error) {
        console.error('Error al procesar mensaje del WebSocket:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('Error de WebSocket:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket desconectado.');
      socket = null;
    };
  },

  disconnect() {
    if (socket) {
      socket.close();
    }
  },

  on(eventName, callback) {
    if (!eventHandlers[eventName]) {
      eventHandlers[eventName] = [];
    }
    eventHandlers[eventName].push(callback);
  },

  off(eventName, callback) {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName] = eventHandlers[eventName].filter(cb => cb !== callback);
    }
  }
};

export default websocketService;