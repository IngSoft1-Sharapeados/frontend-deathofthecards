import { useEffect, useRef } from 'react';
import websocketService from '@/services/websocketService';
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


    const onSetPlayed = (message) => {
      console.log('Set jugado:', message);
      // If consumer passed a handler, call it
      callbacksRef.current.onSetPlayed?.(message);
    };

    const onSecretUpdate = (message) => {
      console.log('Actualización de secreto:', message);
      callbacksRef.current.onSecretUpdate?.({
        playerId: message['jugador-id'],
        secrets: message['lista-secretos'],
      });
    };


    // Suscribirse a eventos
    websocketService.on('actualizacion-mazo', onDeckUpdate);
    websocketService.on('turno-actual', onTurnUpdate);
    websocketService.on('fin-partida', onGameEnd);
    websocketService.on('nuevo-draft', onDraftUpdate);

    websocketService.on('jugar-set', onSetPlayed);

    websocketService.on('actualizacion-secreto', onSecretUpdate);


    // Función de limpieza - SOLO remover listeners, NO desconectar
    return () => {
      websocketService.off('actualizacion-mazo', onDeckUpdate);
      websocketService.off('turno-actual', onTurnUpdate);
      websocketService.off('fin-partida', onGameEnd);
      websocketService.off('nuevo-draft', onDraftUpdate);

  websocketService.off('jugar-set', onSetPlayed);

      websocketService.off('actualizacion-secreto', onSecretUpdate);

    };
  }, []);
};

export default useWebSocket;