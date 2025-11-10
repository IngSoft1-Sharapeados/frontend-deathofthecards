import { useState, useCallback } from 'react';
import { cardService } from '@/services/cardService';

/*
 Hook para gestionar el log de eventos del juego
 Captura eventos como inicio de turno, jugar cartas de evento, jugar sets, etc.
 */
const useEventLog = () => {
  const [events, setEvents] = useState([]);

  const addEvent = useCallback((eventData) => {
    const timestamp = new Date().toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    setEvents(prev => [...prev, { ...eventData, timestamp, id: Date.now() + Math.random() }]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Funciones específicas para cada tipo de evento
  const logTurnStart = useCallback((playerName) => {
    addEvent({
      type: 'turn-start',
      message: `${playerName} comienza su turno`,
      playerName
    });
  }, [addEvent]);

  const logEventCardPlayed = useCallback((playerName, cardId) => {
    const cardName = cardService.getCardNameById(cardId);
    addEvent({
      type: 'event-card',
      message: `${playerName} jugó la carta de evento "${cardName}"`,
      playerName,
      cardName
    });
  }, [addEvent]);

  const logSetPlayed = useCallback((playerName, representacionId, cardsIds = []) => {
    const setName = cardService.getCardNameById(representacionId);
    
    // Obtener nombres de todas las cartas del set
    const cardNames = cardsIds.map(id => cardService.getCardNameById(id));
    const cardsDescription = cardNames.length > 0 
      ? ` (${cardNames.join(', ')})` 
      : '';
    
    addEvent({
      type: 'set-played',
      message: `${playerName} jugó un Set de Detectives: ${setName}${cardsDescription}`,
      playerName,
      setName
    });
  }, [addEvent]);

  const logCardAddedToSet = useCallback((playerName, cardId) => {
    const cardName = cardService.getCardNameById(cardId);
    addEvent({
      type: 'card-added-to-set',
      message: `${playerName} agregó "${cardName}" a un set propio`,
      playerName,
      cardName
    });
  }, [addEvent]);

  const logAriadneOliverPlayed = useCallback((playerName) => {
    addEvent({
      type: 'event-card',
      message: `${playerName} jugó "Ariadne Oliver" y la agregó a un set de oponente`,
      playerName,
      cardName: 'Ariadne Oliver'
    });
  }, [addEvent]);

  const logGameStart = useCallback(() => {
    addEvent({
      type: 'game-start',
      message: '¡La partida ha comenzado!',
    });
  }, [addEvent]);

  return {
    events,
    clearEvents,
    logTurnStart,
    logEventCardPlayed,
    logSetPlayed,
    logCardAddedToSet,
    logAriadneOliverPlayed,
    logGameStart
  };
};

export default useEventLog;
