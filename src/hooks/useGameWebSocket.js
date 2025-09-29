import { useEffect } from 'react';
import websocketService from '@/services/websocketService';

export const useGameWebSocket = (onGameEnd) => {
  useEffect(() => {
    const handleFinPartida = (message) => {
      // message = { evento: "fin-partida", payload: { ganadores: [...], asesinoGano: true/false } }
      onGameEnd(message.payload.ganadores, message.payload.asesinoGano);
    };

    websocketService.on("fin-partida", handleFinPartida);
    
    // Simulación: a los 5s mandamos un evento falso, descomentar para verificar
    /*
    const fakeTimeout = setTimeout(() => {
      handleFinPartida({ payload: { ganadores: ["Alice", "Bob"], asesinoGano: true } });
    }, 5000);
    */
    return () => {
      websocketService.off("fin-partida", handleFinPartida);
      //clearTimeout(fakeTimeout);
    };
  }, [onGameEnd]);
};