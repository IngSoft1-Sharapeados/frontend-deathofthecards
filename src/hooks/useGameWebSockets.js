import { useEffect, useRef } from 'react';
import websocketService from '@/services/websocketService';
import { cardService } from '@/services/cardService';
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

    const onDraftUpdate = (message) => {
      console.log('Actualización de draft:', message);
      callbacksRef.current.onDraftUpdate?.(message['mazo-draft']);
    };


    const onDiscardUpdate = (message) => {
      console.log('Carta descartada:', message);
      const discardCardIds = message.payload?.discardted || message || [];
      const safeDiscardCardIds = Array.isArray(discardCardIds) ? discardCardIds : [];
      const discardCards = safeDiscardCardIds.map(id => ({ id }));
      callbacksRef.current.onDiscardUpdate?.(discardCards);
    };
    // Suscribirse a eventos
    websocketService.on('actualizacion-mazo', onDeckUpdate);
    websocketService.on('turno-actual', onTurnUpdate);
    websocketService.on('fin-partida', onGameEnd);
    websocketService.on('carta-descartada', onDiscardUpdate);  
    websocketService.on('nuevo-draft', onDraftUpdate);

    // Función de limpieza - SOLO remover listeners, NO desconectar
    return () => {
      websocketService.off('actualizacion-mazo', onDeckUpdate);
      websocketService.off('turno-actual', onTurnUpdate);
      websocketService.off('fin-partida', onGameEnd);
      websocketService.off('nuevo-draft', onDraftUpdate);
    };
  }, []);
};

export default useWebSocket;