import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useEventLog from './useEventLog';

describe('useEventLog', () => {
  it('debe inicializar con un array vacío de eventos', () => {
    const { result } = renderHook(() => useEventLog());
    expect(result.current.events).toEqual([]);
  });

  it('debe agregar un evento de inicio de turno', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logTurnStart('Jugador 1');
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('turn-start');
    expect(result.current.events[0].playerName).toBe('Jugador 1');
    expect(result.current.events[0].message).toContain('Jugador 1 comienza su turno');
  });

  it('debe agregar un evento de carta de evento jugada', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logEventCardPlayed('Jugador 2', 17);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('event-card');
    expect(result.current.events[0].playerName).toBe('Jugador 2');
    expect(result.current.events[0].message).toContain('Cards off the Table');
  });

  it('debe agregar un evento de set jugado', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logSetPlayed('Jugador 3', 7);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('set-played');
    expect(result.current.events[0].playerName).toBe('Jugador 3');
    expect(result.current.events[0].message).toContain('Hercule Poirot');
  });

  it('debe agregar un evento de carta agregada a set', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logCardAddedToSet('Jugador 4', 8);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('card-added-to-set');
    expect(result.current.events[0].playerName).toBe('Jugador 4');
    expect(result.current.events[0].message).toContain('Miss Marple');
  });

  it('debe limpiar todos los eventos', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logTurnStart('Jugador 1');
      result.current.logEventCardPlayed('Jugador 2', 17);
    });

    expect(result.current.events).toHaveLength(2);

    act(() => {
      result.current.clearEvents();
    });

    expect(result.current.events).toEqual([]);
  });

  it('debe agregar múltiples eventos en orden', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logTurnStart('Jugador 1');
      result.current.logSetPlayed('Jugador 1', 7);
      result.current.logTurnStart('Jugador 2');
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].message).toContain('Jugador 1 comienza su turno');
    expect(result.current.events[1].message).toContain('Hercule Poirot');
    expect(result.current.events[2].message).toContain('Jugador 2 comienza su turno');
  });

  it('debe agregar un evento de Ariadne Oliver jugada', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logAriadneOliverPlayed('Jugador 5');
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('event-card');
    expect(result.current.events[0].playerName).toBe('Jugador 5');
    expect(result.current.events[0].message).toContain('Ariadne Oliver');
    expect(result.current.events[0].message).toContain('set de oponente');
  });

  it('debe agregar un evento de inicio de partida', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logGameStart();
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('game-start');
    expect(result.current.events[0].message).toContain('partida ha comenzado');
  });

  it('debe incluir los IDs de cartas en el log de set jugado', () => {
    const { result } = renderHook(() => useEventLog());
    
    act(() => {
      result.current.logSetPlayed('Jugador 1', 7, [7, 7, 7]);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('set-played');
    expect(result.current.events[0].message).toContain('Hercule Poirot');
    expect(result.current.events[0].message).toContain('(Hercule Poirot, Hercule Poirot, Hercule Poirot)');
  });
});
