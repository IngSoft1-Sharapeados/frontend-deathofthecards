import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useGameData from '@/hooks/useGameData';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';
import websocketService from '@/services/websocketService';

// Mocks
vi.mock('@/services/apiService');
vi.mock('@/services/cardService');
vi.mock('@/services/websocketService');

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('useGameData', () => {
  const mockGameState = {
    setHand: vi.fn(),
    setIsLoading: vi.fn(),
    setCurrentPlayerId: vi.fn(),
    setDeckCount: vi.fn(),
    setCurrentTurn: vi.fn(),
    setTurnOrder: vi.fn(),
    setPlayers: vi.fn(),
    setHostId: vi.fn(),
    setWinners: vi.fn(),
    setAsesinoGano: vi.fn(),
    setRoles: vi.fn(),
    setSecretCards: vi.fn(),
    setDraftCards: vi.fn()
  };

  const mockGameData = {
    handData: [{ id: 1, url: 'card1.png' }],
    turnData: 1,
    deckData: 50,
    turnOrderData: [1, 2, 3],
    gameDetails: {
      id_anfitrion: 2,
      listaJugadores: [
        { id_jugador: 1, nombre_jugador: 'Player1' },
        { id_jugador: 2, nombre_jugador: 'Player2' }
      ]
    },
    rolesData: { 'asesino-id': 2, 'complice-id': 3 },
    secretCardsData: [{ id: 6, url: 'secret.png' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'playerId') return '1';
      return null;
    });

    // Mock API responses
    apiService.getHand.mockResolvedValue(mockGameData.handData);
    apiService.getTurn.mockResolvedValue(mockGameData.turnData);
    apiService.getDeckCount.mockResolvedValue(mockGameData.deckData);
    apiService.getTurnOrder.mockResolvedValue(mockGameData.turnOrderData);
    apiService.getGameDetails.mockResolvedValue(mockGameData.gameDetails);

    apiService.getRoles.mockResolvedValue(mockGameData.rolesData);
    apiService.getMySecrets.mockResolvedValue(mockGameData.secretCardsData);
    apiService.getDraftCards.mockResolvedValue([]);

    // Mock cardService
    cardService.getPlayingHand.mockImplementation(cards => cards);
    cardService.getSecretCards.mockImplementation(cards => cards);
    cardService.getDraftCards.mockImplementation(cards => cards);
  });

  test('should load game data and connect WebSocket on mount', async () => {
    sessionStorage.setItem('playerId', '1');
    renderHook(() => useGameData('game-123', mockGameState));

    // Wait for async operations
    await waitFor(() => {
      expect(apiService.getHand).toHaveBeenCalledWith('game-123', '1');
    });

    await waitFor(() => {
      expect(mockGameState.setDeckCount).toHaveBeenCalledWith(50);
    });

    // Verify state updates
    expect(mockGameState.setDeckCount).toHaveBeenCalledWith(50);
    expect(mockGameState.setCurrentTurn).toHaveBeenCalledWith(1);
    expect(mockGameState.setTurnOrder).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockGameState.setHostId).toHaveBeenCalledWith(2);
    expect(mockGameState.setPlayers).toHaveBeenCalledWith(mockGameData.gameDetails.listaJugadores);

    // Verify hand processing
    expect(cardService.getPlayingHand).toHaveBeenCalledWith(mockGameData.handData);
    expect(mockGameState.setHand).toHaveBeenCalledWith([
      { id: 1, url: 'card1.png', instanceId: '1-0' }
    ]);

    // Verify WebSocket connection
    await waitFor(() => {
      expect(websocketService.connect).toHaveBeenCalledWith('game-123', '1');
    });

    // Verify loading state updated
    await waitFor(() => {
      expect(mockGameState.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  test('should set winners when deck is empty on load', async () => {
    apiService.getDeckCount.mockResolvedValue(0);

    renderHook(() => useGameData('game-123', mockGameState));

    await vi.waitFor(() => {
      // Con mazo vacío y roles presentes, debe mostrar al asesino (y cómplice si existe)
      expect(mockGameState.setWinners).toHaveBeenCalledWith(['Player2']);
      expect(mockGameState.setAsesinoGano).toHaveBeenCalledWith(true);
    });
  });

  test('should handle loading errors', async () => {
    const error = new Error('Failed to load');
    apiService.getHand.mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useGameData('game-123', mockGameState));

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar los datos del juego:', error);
      expect(mockGameState.setIsLoading).toHaveBeenCalledWith(false);
    });
    
    consoleSpy.mockRestore();
  });

  test('should not load data if no playerId in sessionStorage', async () => {
    sessionStorage.getItem.mockReturnValue(null);

    renderHook(() => useGameData('game-123', mockGameState));

    // Esperar a que el efecto complete
    await waitFor(() => {
      expect(mockGameState.setIsLoading).toHaveBeenCalledWith(false);
    });

    // Verificar que no se llamó a las APIs
    expect(apiService.getHand).not.toHaveBeenCalled();
  });
});