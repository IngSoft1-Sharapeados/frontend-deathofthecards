import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useCardActions from '@/hooks/useCardActions';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';

vi.mock('@/services/apiService');
vi.mock('@/services/cardService');

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
    expect(mockGameState.setHand).toHaveBeenCalledWith([
      // The hand should now only contain the cards that were not selected
      { id: 2, url: 'card2.png', instanceId: 'instance-2' },
      { id: 3, url: 'card3.png', instanceId: 'instance-3' }
    ]);

    // 3. Verify selections were cleared
    expect(mockGameState.setSelectedCards).toHaveBeenCalledWith([]);

    // 4. Verify the turn phase was switched to 'drawing'
    expect(mockGameState.setPlayerTurnState).toHaveBeenCalledWith('drawing');
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