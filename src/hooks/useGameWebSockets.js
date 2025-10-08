import { useEffect, useRef } from 'react';
import websocketService from '@/services/websocketService';
/* No gestiona coneccion, solo eventos*/ 
const useWebSocket = (callbacks) => {
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    // Definir handlers
    const onDeckUpdate = (message) => {
      console.log(' Actualización de mazo:', message);
      callbacksRef.current.onDeckUpdate?.(message['cantidad-restante-mazo']);
    };

    const onTurnUpdate = (message) => {
      console.log('Actualización de turno:', message);
      callbacksRef.current.onTurnUpdate?.(message['turno-actual']);
    };

    const onGameEnd = (message) => {
      console.log('Fin de partida:', message);
      callbacksRef.current.onGameEnd?.({
        winners: message.ganadores || [],
        asesinoGano: message.asesino_gano || false
      });
    };

    const onDiscardUpdate = (message) => {
      console.log('Carta descartada:', message);
      callbacksRef.current.onDiscardUpdate?.(message.payload?.discardted || []);
    };
    // Suscribirse a eventos
    websocketService.on('actualizacion-mazo', onDeckUpdate);
    websocketService.on('turno-actual', onTurnUpdate);
    websocketService.on('fin-partida', onGameEnd);
    websocketService.on('carta-descartada', onDiscardUpdate);
    // Función de limpieza - SOLO remover listeners, NO desconectar
    return () => {
      websocketService.off('actualizacion-mazo', onDeckUpdate);
      websocketService.off('turno-actual', onTurnUpdate);
      websocketService.off('fin-partida', onGameEnd);
    };
  }, []);
};

export default useWebSocket;