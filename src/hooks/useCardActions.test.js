import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useCardActions from '@/hooks/useCardActions';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';

vi.mock('@/services/apiService');
vi.mock('@/services/cardService');
vi.mock('@/utils/detectiveSetValidation', () => ({
  isValidDetectiveSet: vi.fn(),
}));

describe('useCardActions', () => {
  const mockGameState = {
    hand: [
      { id: 1, url: 'card1.png', instanceId: 'instance-1' },
      { id: 2, url: 'card2.png', instanceId: 'instance-2' },
      { id: 3, url: 'card3.png', instanceId: 'instance-3' }
    ],
    setHand: vi.fn(),
    selectedCards: [],
    setSelectedCards: vi.fn(),
    currentPlayerId: 1,
    isMyTurn: true,
    setPlayerTurnState: vi.fn(),
    setHasPlayedSetThisTurn: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear mocks 
    mockGameState.setHand.mockClear();
    mockGameState.setSelectedCards.mockClear();

    // Configurar mocks por defecto
    apiService.discardCards.mockResolvedValue({});
    apiService.drawCards.mockResolvedValue([]);
    cardService.getPlayingHand.mockImplementation(cards => cards);
    mockGameState.setPlayerTurnState.mockClear();
    // Por defecto, que el set sea inválido salvo que el test lo fuerce
    isValidDetectiveSet.mockReturnValue(false);
  });

  test('allows selecting draft cards after playing a set while in discarding (hand < 6)', async () => {
    const state = {
      ...mockGameState,
      playerTurnState: 'discarding',
      hand: [
        { id: 7, url: 'poirot1.png', instanceId: 'i-1' },
        { id: 9, url: 'satterthwaite.png', instanceId: 'i-3' },
      ],
      hasPlayedSetThisTurn: true,
      selectedDraftCards: [],
      setSelectedDraftCards: vi.fn(),
      draftCards: [
        { id: 101, url: 'draftA.png', instanceId: 'd-1' },
        { id: 102, url: 'draftB.png', instanceId: 'd-2' },
      ],
    };

    const { result } = renderHook(() => useCardActions('game-123', state));

    await act(async () => {
      result.current.handleDraftCardClick('d-1');
    });

    // Ensure draft selection was attempted with functional update logic
    expect(state.setSelectedDraftCards).toHaveBeenCalled();
    const updater = state.setSelectedDraftCards.mock.calls[0][0];
    const nextSel = typeof updater === 'function' ? updater([]) : updater;
    expect(nextSel).toEqual(['d-1']);
  });
  test('should handle successful discard and update turn phase', async () => {
    const stateWithSelection = {
      ...mockGameState,
      selectedCards: ['instance-1'] // Select one card to discard
    };

    const { result } = renderHook(() =>
      useCardActions('game-123', stateWithSelection)
    );

    await act(async () => {
      await result.current.handleDiscard();
    });

    // 1. Verify discardCards was called with the correct card ID
    expect(apiService.discardCards).toHaveBeenCalledWith('game-123', 1, [1]);

    // 2. Verify the hand was updated optimistically
    expect(mockGameState.setHand).toHaveBeenCalled();
    const arg = mockGameState.setHand.mock.calls[0][0];
    if (typeof arg === 'function') {
      // Functional update: evaluate with previous hand
      const prev = [
        { id: 1, url: 'card1.png', instanceId: 'instance-1' },
        { id: 2, url: 'card2.png', instanceId: 'instance-2' },
        { id: 3, url: 'card3.png', instanceId: 'instance-3' }
      ];
      const result = arg(prev);
      expect(result).toEqual([
        { id: 2, url: 'card2.png', instanceId: 'instance-2' },
        { id: 3, url: 'card3.png', instanceId: 'instance-3' }
      ]);
    } else {
      // Direct array update
      expect(arg).toEqual([
        { id: 2, url: 'card2.png', instanceId: 'instance-2' },
        { id: 3, url: 'card3.png', instanceId: 'instance-3' }
      ]);
    }

    // 3. Verify selections were cleared
    expect(mockGameState.setSelectedCards).toHaveBeenCalledWith([]);

    // 4. Verify the turn phase switched using functional update to 'drawing'
    expect(mockGameState.setPlayerTurnState).toHaveBeenCalled();
    const phaseArg = mockGameState.setPlayerTurnState.mock.calls[0][0];
    if (typeof phaseArg === 'function') {
      const resultPhase = phaseArg('discarding');
      expect(resultPhase).toBe('drawing');
    } else {
      expect(phaseArg).toBe('drawing');
    }
  });

  test('should return to discarding phase after playing a valid set and update hand/selection', async () => {
    const stateForPlay = {
      ...mockGameState,
      hand: [
        { id: 7, url: 'poirot1.png', instanceId: 'i-1' },
        { id: 7, url: 'poirot2.png', instanceId: 'i-2' },
        { id: 9, url: 'satterthwaite.png', instanceId: 'i-3' },
      ],
      selectedCards: ['i-1', 'i-2'],
      isMyTurn: true,
      // estamos en fase de descarte
      playerTurnState: 'discarding',
    };

    // Forzar que el set sea válido
    isValidDetectiveSet.mockReturnValue(true);

    const { result } = renderHook(() => useCardActions('game-123', stateForPlay));

    await act(async () => {
      await result.current.handlePlay();
    });

    // setHand debe eliminar las cartas seleccionadas
    expect(stateForPlay.setHand).toHaveBeenCalled();
    const arg = stateForPlay.setHand.mock.calls[0][0];
    const prev = [
      { id: 7, url: 'poirot1.png', instanceId: 'i-1' },
      { id: 7, url: 'poirot2.png', instanceId: 'i-2' },
      { id: 9, url: 'satterthwaite.png', instanceId: 'i-3' },
    ];
    const next = typeof arg === 'function' ? arg(prev) : arg;
    expect(next).toEqual([
      { id: 9, url: 'satterthwaite.png', instanceId: 'i-3' },
    ]);

    // selección limpiada
    expect(stateForPlay.setSelectedCards).toHaveBeenCalledWith([]);

  // marca el flag de set jugado y vuelve a descarte
  expect(stateForPlay.setHasPlayedSetThisTurn).toHaveBeenCalledWith(true);
  expect(stateForPlay.setPlayerTurnState).toHaveBeenCalledWith('discarding');
  });

  test('should not discard if no cards selected', async () => {
    const { result } = renderHook(() =>
      useCardActions('game-123', mockGameState)
    );
    await act(async () => {
      await result.current.handleDiscard();
    });
    expect(apiService.discardCards).not.toHaveBeenCalled();
  });

  test('should not discard if not players turn', async () => {
    const stateNotMyTurn = {
      ...mockGameState,
      selectedCards: ['instance-1'],
      isMyTurn: false
    };
    const { result } = renderHook(() =>
      useCardActions('game-123', stateNotMyTurn)
    );
    await act(async () => {
      await result.current.handleDiscard();
    });
    expect(apiService.discardCards).not.toHaveBeenCalled();
  });

});