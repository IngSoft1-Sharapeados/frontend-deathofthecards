// Archivo: websocketService.js

let socket = null;

// Se inicializa vacío para mayor flexibilidad. 
// El método 'on' creará dinámicamente los eventos necesarios.
const eventHandlers = {};

const websocketService = {
  /**
   * Conecta al servidor WebSocket.
   * @param {string} gameId - El ID de la partida.
   * @param {string} playerId - El ID del jugador.
   */
  connect(gameId, playerId) {
    // Evita múltiples conexiones si ya existe una.
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.warn('Ya existe una conexión WebSocket activa.');
      return;
    }

    const wsURL = `ws://localhost:8000/partidas/ws/${gameId}/${playerId}`;
    
    socket = new WebSocket(wsURL);

    socket.onopen = () => {
      console.log('WebSocket conectado exitosamente.');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Mensaje recibido:', message);

        // Si existe el evento y hay funciones suscritas, las ejecuta.
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
      socket = null; // Limpia la variable para permitir una nueva conexión.
    };
  },

  /**
   * Cierra la conexión WebSocket si está activa.
   */
  disconnect() {
    if (socket) {
      socket.close();
    }
  },

  /**
   * Suscribe una función (callback) a un evento específico.
   * @param {string} eventName - El nombre del evento (ej. 'union-jugador').
   * @param {Function} callback - La función a ejecutar cuando se reciba el evento.
   */
  on(eventName, callback) {
    // Si el evento no existe en el objeto, crea un array para él.
    if (!eventHandlers[eventName]) {
      eventHandlers[eventName] = [];
    }
    eventHandlers[eventName].push(callback);
  },

  /**
   * Desuscribe una función (callback) de un evento específico.
   * @param {string} eventName - El nombre del evento.
   * @param {Function} callback - La función que se quiere remover.
   */
  off(eventName, callback) {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName] = eventHandlers[eventName].filter(cb => cb !== callback);
    }
  },

  emit(eventName, message) {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName].forEach(callback => callback(message));
    }
  }
};

// Exponer para desarrollo - ELIMINAR EN PRODUCCIÓN
if (process.env.NODE_ENV === 'development') {
  window.websocketService = websocketService;
  window.eventHandlers = eventHandlers; 
}

export default websocketService;