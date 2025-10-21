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

      const data = message.payload || message;

      callbacksRef.current.onGameEnd?.({
        winners: data.ganadores || [],
        asesinoGano: data.asesinoGano ?? data.asesino_gano ?? false
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

    const onCardsOffTheTablePlayed = (message) => {
      console.log('Evento "Cards off the Table" jugado:', message);
      callbacksRef.current.onCardsOffTheTablePlayed?.(message);
    };

    const onAnotherVictimPlayed = (message) => {
      console.log('Evento "Another Victim" jugado:', message);
      callbacksRef.current.onAnotherVictimPlayed?.(message);
    };

    const onOneMorePlayed = (message) => {
      console.log('Evento "And Then There Was One More" jugado:', message);
      callbacksRef.current.onOneMorePlayed?.(message);
    };


    const onDiscardUpdate = (message) => {
      console.log('Carta descartada:', message);
      const discardCardIds = message.payload?.discardted || message || [];
      const safeDiscardCardIds = Array.isArray(discardCardIds) ? discardCardIds : [];
      const discardCards = safeDiscardCardIds.map(id => ({ id }));
      callbacksRef.current.onDiscardUpdate?.(discardCards);
    };

    const onHandUpdate = (message) => {
      console.log('Actualización de mano:', message);
      callbacksRef.current.onHandUpdate?.(message);
    };

    const onDelayEscapePlayed = (message) => {
      console.log('Evento "Delay Escape" jugado:', message);
      callbacksRef.current.onDelayEscapePlayed?.(message);
    };

    const onEarlyTrainPlayed = (message) => {
      console.log('Evento "Early Train" jugado:', message);
      callbacksRef.current.onEarlyTrainPlayed?.(message);
    };

    const onLookIntoTheAshesPlayed = (message) => {
      console.log('Evento "Look Into The Ashes" jugado:', message);
      callbacksRef.current.onLookIntoTheAshesPlayed?.({
        playerId: message.jugador_id
      });
    };
    // Suscribirse a eventos
    websocketService.on('actualizacion-mazo', onDeckUpdate);
    websocketService.on('turno-actual', onTurnUpdate);
    websocketService.on('fin-partida', onGameEnd);
    websocketService.on('carta-descartada', onDiscardUpdate);
    websocketService.on('nuevo-draft', onDraftUpdate);
    websocketService.on('se-jugo-cards-off-the-table', onCardsOffTheTablePlayed);
    websocketService.on('se-jugo-another-victim', onAnotherVictimPlayed);
    websocketService.on('se-jugo-one-more', onOneMorePlayed);
    websocketService.on('jugar-set', onSetPlayed);
    websocketService.on('actualizacion-mano', onHandUpdate);
    websocketService.on('se-jugo-delay-escape', onDelayEscapePlayed);
    websocketService.on('se-jugo-look-into-the-ashes', onLookIntoTheAshesPlayed);
    websocketService.on('se-jugo-early-train', onEarlyTrainPlayed);
    websocketService.on('actualizacion-secreto', onSecretUpdate);


    // Función de limpieza - SOLO remover listeners, NO desconectar
    return () => {
      websocketService.off('actualizacion-mazo', onDeckUpdate);
      websocketService.off('turno-actual', onTurnUpdate);
      websocketService.off('fin-partida', onGameEnd);
      websocketService.off('nuevo-draft', onDraftUpdate);
      websocketService.off('se-jugo-cards-off-the-table', onCardsOffTheTablePlayed);
      websocketService.off('se-jugo-another-victim', onAnotherVictimPlayed);
      websocketService.off('se-jugo-one-more', onOneMorePlayed);
      websocketService.off('actualizacion-mano', onHandUpdate);
      websocketService.off('jugar-set', onSetPlayed);
      websocketService.off('se-jugo-delay-escape', onDelayEscapePlayed);
      websocketService.off('se-jugo-look-into-the-ashes', onLookIntoTheAshesPlayed);
      websocketService.off('se-jugo-early-train', onEarlyTrainPlayed);
      websocketService.off('actualizacion-secreto', onSecretUpdate);
    };
  }, []);
};

export default useWebSocket;
