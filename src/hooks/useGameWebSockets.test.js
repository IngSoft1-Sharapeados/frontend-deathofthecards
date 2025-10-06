import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useWebSocket from '@/hooks/useGameWebSockets';
import websocketService from '@/services/websocketService';

vi.mock('@/services/websocketService');

describe('useWebSocket', () => {
  const mockCallbacks = {
    onDeckUpdate: vi.fn(),
    onTurnUpdate: vi.fn(),
    onGameEnd: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should subscribe to WebSocket events on mount', () => {
    renderHook(() => useWebSocket(mockCallbacks));

    expect(websocketService.on).toHaveBeenCalledWith('actualizacion-mazo', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('turno-actual', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('fin-partida', expect.any(Function));
  });

  test('should unsubscribe from WebSocket events on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket(mockCallbacks));

    unmount();

    expect(websocketService.off).toHaveBeenCalledWith('actualizacion-mazo', expect.any(Function));
    expect(websocketService.off).toHaveBeenCalledWith('turno-actual', expect.any(Function));
    expect(websocketService.off).toHaveBeenCalledWith('fin-partida', expect.any(Function));
  });

  test('should call callbacks when WebSocket events are received', () => {
    let deckUpdateHandler, turnUpdateHandler, gameEndHandler;
    
    websocketService.on.mockImplementation((event, handler) => {
      if (event === 'actualizacion-mazo') deckUpdateHandler = handler;
      if (event === 'turno-actual') turnUpdateHandler = handler;
      if (event === 'fin-partida') gameEndHandler = handler;
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
  });

  test('should update callbacks when they change', () => {
    const initialCallbacks = { onDeckUpdate: vi.fn() };
    const { rerender } = renderHook(({ callbacks }) => useWebSocket(callbacks), {
      initialProps: { callbacks: initialCallbacks }
    });

    const newCallbacks = { onDeckUpdate: vi.fn() };
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
  
});