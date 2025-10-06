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
    isMyTurn: true
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
  });

  test('should handle successful discard and draw', async () => {
    const stateWithSelection = {
      ...mockGameState,
      selectedCards: ['instance-1', 'instance-2']
    };

    const { result } = renderHook(() => 
      useCardActions('game-123', stateWithSelection)
    );

    await act(async () => {
      await result.current.handleDiscard();
    });

    // 1. Verificar discard llamado con IDs correctos
    expect(apiService.discardCards).toHaveBeenCalledWith(
      'game-123',
      1,
      [1, 2] // IDs de las cartas seleccionadas
    );
    // 2. Verificar que se actualiza la mano (removiendo cartas descartadas)
    expect(mockGameState.setHand).toHaveBeenCalledWith([
      { id: 3, url: 'card3.png', instanceId: 'instance-3' }
    ]);
    // 3. Verificar que se limpian las selecciones
    expect(mockGameState.setSelectedCards).toHaveBeenCalledWith([]);
    // 4. Verificar draw llamado con cantidad correcta (6 - 1 = 5)
    expect(apiService.drawCards).toHaveBeenCalledWith('game-123', 1, 5);
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