import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useWebSocket from '@/hooks/useGameWebSockets';
import websocketService from '@/services/websocketService';

vi.mock('@/services/websocketService');

describe('useWebSocket', () => {
  const mockCallbacks = {
    onDeckUpdate: vi.fn(),
    onTurnUpdate: vi.fn(),
    onGameEnd: vi.fn(),
    onDiscardUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should subscribe to WebSocket events on mount', () => {
    renderHook(() => useWebSocket(mockCallbacks));

    expect(websocketService.on).toHaveBeenCalledWith('actualizacion-mazo', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('turno-actual', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('fin-partida', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('carta-descartada', expect.any(Function));
  });

  test('should unsubscribe from WebSocket events on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket(mockCallbacks));

    unmount();

    expect(websocketService.off).toHaveBeenCalledWith('actualizacion-mazo', expect.any(Function));
    expect(websocketService.off).toHaveBeenCalledWith('turno-actual', expect.any(Function));
    expect(websocketService.off).toHaveBeenCalledWith('fin-partida', expect.any(Function));
  });

  test('should call callbacks when WebSocket events are received', () => {
    let deckUpdateHandler, turnUpdateHandler, gameEndHandler, discardUpdateHandler; 
    
    websocketService.on.mockImplementation((event, handler) => {
      if (event === 'actualizacion-mazo') deckUpdateHandler = handler;
      if (event === 'turno-actual') turnUpdateHandler = handler;
      if (event === 'fin-partida') gameEndHandler = handler;
      if (event === 'carta-descartada') discardUpdateHandler = handler;
    });

    renderHook(() => useWebSocket(mockCallbacks));

    deckUpdateHandler({ 'cantidad-restante-mazo': 42 });
    expect(mockCallbacks.onDeckUpdate).toHaveBeenCalledWith(42);

    turnUpdateHandler({ 'turno-actual': 2 });
    expect(mockCallbacks.onTurnUpdate).toHaveBeenCalledWith(2);

    gameEndHandler({ ganadores: ['Player1'], asesino_gano: true });
    expect(mockCallbacks.onGameEnd).toHaveBeenCalledWith({
      winners: ['Player1'],
      asesinoGano: true
    });

    discardUpdateHandler({ payload: { discardted: [23, 21, 20] } });
    expect(mockCallbacks.onDiscardUpdate).toHaveBeenCalledWith([
      { id: 23 },
      { id: 21 },
      { id: 20 }
    ]);
  });

  test('should update callbacks when they change', () => {
    const initialCallbacks = { 
      onDeckUpdate: vi.fn(),
      onDiscardUpdate: vi.fn() 
    };
    const { rerender } = renderHook(({ callbacks }) => useWebSocket(callbacks), {
      initialProps: { callbacks: initialCallbacks }
    });

    const newCallbacks = { 
      onDeckUpdate: vi.fn(),
      onDiscardUpdate: vi.fn() 
    };
    rerender({ callbacks: newCallbacks });

    let deckUpdateHandler;
    websocketService.on.mock.calls.forEach(([event, handler]) => {
      if (event === 'actualizacion-mazo') deckUpdateHandler = handler;
    });

    deckUpdateHandler({ 'cantidad-restante-mazo': 42 });
    expect(newCallbacks.onDeckUpdate).toHaveBeenCalledWith(42);
    expect(initialCallbacks.onDeckUpdate).not.toHaveBeenCalled();
  });

  test('should handle game end event with undefined values', () => {
    const mockCallbacks = {
      onGameEnd: vi.fn()
    };
    let gameEndHandler;
    websocketService.on.mockImplementation((event, handler) => {
      if (event === 'fin-partida') gameEndHandler = handler;
    });
    renderHook(() => useWebSocket(mockCallbacks));
    gameEndHandler({
      ganadores: undefined,
      asesino_gano: undefined
    });
    expect(mockCallbacks.onGameEnd).toHaveBeenCalledWith({
      winners: [], 
      asesinoGano: false 
    });
  });

  describe('discard update event', () => {
    test('should transform discard IDs to card objects', () => {
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      discardHandler({ payload: { discardted: [23, 21, 20] } });

      expect(mockCallbacks.onDiscardUpdate).toHaveBeenCalledWith([
        { id: 23 },
        { id: 21 },
        { id: 20 }
      ]);
    });

    test('should handle empty discard array', () => {
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      discardHandler({ payload: { discardted: [] } });

      expect(mockCallbacks.onDiscardUpdate).toHaveBeenCalledWith([]);
    });

    test('should handle missing payload gracefully', () => {
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      discardHandler({}); // Sin payload

      expect(mockCallbacks.onDiscardUpdate).toHaveBeenCalledWith([]);
    });

    test('should handle direct array message (backward compatibility)', () => {
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      discardHandler([23, 21, 20]); 

      expect(mockCallbacks.onDiscardUpdate).toHaveBeenCalledWith([
        { id: 23 },
        { id: 21 },
        { id: 20 }
      ]);
    });
  });

  describe('Endpoint and WebSocket consistency', () => {
    test('should show same top card from endpoint and WebSocket', () => {
      // Simular datos del endpoint (formato backend)
      const endpointDiscardData = [
        { id: 23, nombre: 'Event Delay Escape' },
        { id: 21, nombre: 'Event Card Trade' },
        { id: 20, nombre: 'Event Another Victim' }
      ];

      // Simular mensaje WebSocket (formato backend)
      const websocketDiscardData = {
        payload: { discardted: [23, 21, 20] }
      };

      let endpointTopCard, websocketTopCard;

      // Procesar datos del endpoint (como lo hace useGameData)
      if (Array.isArray(endpointDiscardData) && endpointDiscardData.length > 0) {
        endpointTopCard = { id: endpointDiscardData[0].id };
      }

      // Procesar datos del WebSocket (como lo hace useWebSocket)
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      const mockCallbacks = {
        onDiscardUpdate: vi.fn((discardCards) => {
          if (discardCards.length > 0) {
            websocketTopCard = discardCards[0]; // Primera carta del WebSocket
          }
        })
      };

      renderHook(() => useWebSocket(mockCallbacks));
      
      // Simular el mensaje WebSocket
      discardHandler(websocketDiscardData);

      // Verificar que ambas fuentes muestran la misma carta top
      expect(endpointTopCard).toEqual({ id: 23 });
      expect(websocketTopCard).toEqual({ id: 23 });
      expect(endpointTopCard.id).toBe(websocketTopCard.id);
    });

    test('should handle empty discard pile consistently', () => {
      const endpointDiscardData = [];
      const websocketDiscardData = {
        payload: { discardted: [] }
      };

      let endpointTopCard, websocketTopCard;

      // Procesar endpoint
      if (Array.isArray(endpointDiscardData) && endpointDiscardData.length > 0) {
        endpointTopCard = { id: endpointDiscardData[0].id };
      } else {
        endpointTopCard = null;
      }

      // Procesar WebSocket
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      const mockCallbacks = {
        onDiscardUpdate: vi.fn((discardCards) => {
          websocketTopCard = discardCards.length > 0 ? discardCards[0] : null;
        })
      };

      renderHook(() => useWebSocket(mockCallbacks));
      discardHandler(websocketDiscardData);

      // Ambos deberían ser null/empty cuando no hay cartas
      expect(endpointTopCard).toBeNull();
      expect(websocketTopCard).toBeNull();
    });

    test('should maintain card order consistency between endpoint and WebSocket', () => {
      // Simular que el endpoint devuelve las cartas en cierto orden
      const endpointDiscardData = [
        { id: 20, nombre: 'Event Another Victim' },
        { id: 21, nombre: 'Event Card Trade' },
        { id: 23, nombre: 'Event Delay Escape' }
      ];

      // WebSocket envía las mismas cartas en el mismo orden
      const websocketDiscardData = {
        payload: { discardted: [20, 21, 23] }
      };

      let endpointCards, websocketCards;

      // Procesar endpoint
      if (Array.isArray(endpointDiscardData)) {
        endpointCards = endpointDiscardData.map(card => ({ id: card.id }));
      }

      // Procesar WebSocket
      let discardHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'carta-descartada') discardHandler = handler;
      });

      const mockCallbacks = {
        onDiscardUpdate: vi.fn((discardCards) => {
          websocketCards = discardCards;
        })
      };

      renderHook(() => useWebSocket(mockCallbacks));
      discardHandler(websocketDiscardData);

      // Verificar que ambas fuentes tienen el mismo orden de cartas
      expect(endpointCards).toEqual([{ id: 20 }, { id: 21 }, { id: 23 }]);
      expect(websocketCards).toEqual([{ id: 20 }, { id: 21 }, { id: 23 }]);
      
      // Verificar específicamente la top card
      expect(endpointCards[0].id).toBe(20);
      expect(websocketCards[0].id).toBe(20);
    });
  });

  describe('Secret update event', () => {
    test('should call onSecretUpdate with player ID and secrets', () => {
      const mockCallbacks = {
        onSecretUpdate: vi.fn()
      };

      let secretUpdateHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'actualizacion-secreto') secretUpdateHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      const secretMessage = {
        'jugador-id': 1,
        'lista-secretos': [
          { revelado: true },
          { revelado: false },
          { revelado: false }
        ]
      };

      secretUpdateHandler(secretMessage);

      expect(mockCallbacks.onSecretUpdate).toHaveBeenCalledWith({
        playerId: 1,
        secrets: [
          { revelado: true },
          { revelado: false },
          { revelado: false }
        ]
      });
    });

    test('should handle all secrets revealed (disgrace state)', () => {
      const mockCallbacks = {
        onSecretUpdate: vi.fn()
      };

      let secretUpdateHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'actualizacion-secreto') secretUpdateHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      const allRevealedMessage = {
        'jugador-id': 2,
        'lista-secretos': [
          { revelado: true },
          { revelado: true },
          { revelado: true }
        ]
      };

      secretUpdateHandler(allRevealedMessage);

      expect(mockCallbacks.onSecretUpdate).toHaveBeenCalledWith({
        playerId: 2,
        secrets: [
          { revelado: true },
          { revelado: true },
          { revelado: true }
        ]
      });
    });

    test('should handle no secrets revealed', () => {
      const mockCallbacks = {
        onSecretUpdate: vi.fn()
      };

      let secretUpdateHandler;
      websocketService.on.mockImplementation((event, handler) => {
        if (event === 'actualizacion-secreto') secretUpdateHandler = handler;
      });

      renderHook(() => useWebSocket(mockCallbacks));

      const noRevealedMessage = {
        'jugador-id': 3,
        'lista-secretos': [
          { revelado: false },
          { revelado: false },
          { revelado: false }
        ]
      };

      secretUpdateHandler(noRevealedMessage);

      expect(mockCallbacks.onSecretUpdate).toHaveBeenCalledWith({
        playerId: 3,
        secrets: [
          { revelado: false },
          { revelado: false },
          { revelado: false }
        ]
      });
    });
  });
});