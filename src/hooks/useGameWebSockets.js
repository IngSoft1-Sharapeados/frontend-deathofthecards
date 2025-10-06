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
      const payload = message?.payload || {};
      const winners = payload.ganadores ?? message.ganadores ?? [];
      const asesinoGano =
        payload.asesinoGano ?? message.asesinoGano ?? message.asesino_gano ?? false;
      callbacksRef.current.onGameEnd?.({ winners, asesinoGano });
    };

    // Suscribirse a eventos
    websocketService.on('actualizacion-mazo', onDeckUpdate);
    websocketService.on('turno-actual', onTurnUpdate);
    websocketService.on('fin-partida', onGameEnd);

    // Función de limpieza - SOLO remover listeners, NO desconectar
    return () => {
      websocketService.off('actualizacion-mazo', onDeckUpdate);
      websocketService.off('turno-actual', onTurnUpdate);
      websocketService.off('fin-partida', onGameEnd);
    };
  }, []);
};

export default useWebSocket;