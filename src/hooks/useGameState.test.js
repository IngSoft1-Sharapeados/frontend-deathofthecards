import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import useGameState from '@/hooks/useGameState';

describe('useGameState', () => {
  beforeEach(() => {
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useGameState());
    
    expect(result.current.hand).toEqual([]);
    expect(result.current.selectedCards).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentPlayerId).toBe(null);
    expect(result.current.deckCount).toBe(0);
    expect(result.current.currentTurn).toBe(null);
    expect(result.current.winners).toBe(null);
    expect(result.current.asesinoGano).toBe(false);
  });

  test('should calculate isMyTurn correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.setCurrentPlayerId(1);
      result.current.setCurrentTurn(1);
    });
    
    expect(result.current.isMyTurn).toBe(true);
    
    // Change turn to other player
    act(() => {
      result.current.setCurrentTurn(2);
    });
    
    expect(result.current.isMyTurn).toBe(false);
  });

  test('should calculate isDiscardButtonEnabled correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    // Not enabled: no cards selected, not my turn
    act(() => {
      result.current.setCurrentPlayerId(1);
      result.current.setCurrentTurn(2); // Not my turn
    });
    expect(result.current.isDiscardButtonEnabled).toBe(false);
    
    // Not enabled: my turn but no cards selected
    act(() => {
      result.current.setCurrentTurn(1); // My turn
    });
    expect(result.current.isDiscardButtonEnabled).toBe(false);
    
    // Enabled: my turn and cards selected
    act(() => {
      result.current.setSelectedCards(['card-1', 'card-2']);
    });
    expect(result.current.isDiscardButtonEnabled).toBe(true);
  });

});