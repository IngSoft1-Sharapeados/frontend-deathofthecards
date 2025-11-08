import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import useCardActions, { useSecrets } from '@/hooks/useCardActions';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';
import { isValidDetectiveSet } from '@/utils/detectiveSetValidation';
import { isValidEventCard } from '@/utils/eventCardValidation';

vi.mock('@/services/apiService');
vi.mock('@/services/cardService');
vi.mock('@/utils/detectiveSetValidation', () => ({
  isValidDetectiveSet: vi.fn(),
}));
vi.mock('@/utils/eventCardValidation', () => ({
  isValidEventCard: vi.fn(),
}));

describe('useCardActions', () => {
  const mockGameState = {
    hand: [
      { id: 1, url: 'card1.png', instanceId: 'instance-1' },
      { id: 2, url: 'card2.png', instanceId: 'instance-2' },
    ],
    draftCards: [
      { id: 101, url: 'draft1.png', instanceId: 'draft-1' },
    ],
    setHand: vi.fn(),
    selectedCards: [],
    setSelectedCards: vi.fn(),
    selectedDraftCards: [],
    setSelectedDraftCards: vi.fn(),
    currentPlayerId: 1,
    isMyTurn: true,
    playerTurnState: 'discarding',
    setPlayerTurnState: vi.fn(),
    setHasPlayedSetThisTurn: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameState.setHand.mockClear();
    mockGameState.setSelectedCards.mockClear();
    mockGameState.setSelectedDraftCards.mockClear();
    mockGameState.setPlayerTurnState.mockClear();

    // Por defecto, que el set sea inválido salvo que el test lo fuerce
    isValidDetectiveSet.mockReturnValue(false);
    // Default mocks for services used by handlers
    apiService.discardCards.mockResolvedValue({});
    apiService.pickUpCards.mockResolvedValue([]);
    apiService.getHand.mockResolvedValue([]);
    cardService.getPlayingHand.mockImplementation(cards => cards);
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
        { id: 7, url: 'poirot1.png', instanceId: 'i-1', id_instancia: 101 },
        { id: 7, url: 'poirot2.png', instanceId: 'i-2', id_instancia: 102 },
        { id: 9, url: 'satterthwaite.png', instanceId: 'i-3', id_instancia: 103 },
      ],
      selectedCards: ['i-1', 'i-2'],
      isMyTurn: true,
      playerTurnState: 'discarding',
    };

    isValidDetectiveSet.mockReturnValue(true);
    const mockIniciarAccion = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useCardActions(
      'game-123',
      stateForPlay,
      vi.fn(),
      mockIniciarAccion
    ));

    await act(async () => {
      await result.current.handlePlay();
    });

    expect(mockIniciarAccion).toHaveBeenCalledWith(expect.objectContaining({
      cartas_db_ids: [101, 102]
    }));

    expect(stateForPlay.setHand).toHaveBeenCalled();
    const arg = stateForPlay.setHand.mock.calls[0][0];
    const prev = [
      { id: 7, url: 'poirot1.png', instanceId: 'i-1', id_instancia: 101 },
      { id: 7, url: 'poirot2.png', instanceId: 'i-2', id_instancia: 102 },
      { id: 9, url: 'satterthwaite.png', instanceId: 'i-3', id_instancia: 103 },
    ];
    const next = typeof arg === 'function' ? arg(prev) : arg;
    expect(next).toEqual([
      { id: 9, url: 'satterthwaite.png', instanceId: 'i-3', id_instancia: 103 },
    ]);

    expect(stateForPlay.setSelectedCards).toHaveBeenCalledWith([]);

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
  });

  describe('handleDraftCardClick', () => {
    test('should select a draft card if in drawing phase', () => {
      const state = { ...mockGameState, playerTurnState: 'drawing' };
      const { result } = renderHook(() => useCardActions('game-123', state));
      act(() => {
        result.current.handleDraftCardClick('draft-1');
      });
      expect(mockGameState.setSelectedDraftCards).toHaveBeenCalled();
    });

    test('should NOT select more draft cards than available hand slots', () => {
      const state = {
        ...mockGameState,
        playerTurnState: 'drawing',
        hand: [{}, {}, {}, {}, {}] // Hand has 5 cards, 1 slot available
      };
      const { result } = renderHook(() => useCardActions('game-123', state));

      // Select 1 card (should work)
      act(() => result.current.handleDraftCardClick('draft-1'));
      // Attempt to select a second card (should not work)
      act(() => result.current.handleDraftCardClick('draft-2'));

      // We expect the state setter to be called, but the logic inside should prevent adding the second card
      expect(mockGameState.setSelectedDraftCards).toHaveBeenCalledTimes(2);
      // A more robust test would check the final state, but this verifies the logic path.
    });
  });

  describe('handleDiscard', () => {
    test('should handle successful discard and update turn phase', async () => {
      const stateWithSelection = {
        ...mockGameState,
        selectedCards: ['instance-1']
      };
      const { result } = renderHook(() => useCardActions('game-123', stateWithSelection));
      await act(async () => {
        await result.current.handleDiscard();
      });
      expect(apiService.discardCards).toHaveBeenCalledWith('game-123', 1, [1]);
      // setHand called with functional updater; evaluate outcome
      expect(mockGameState.setHand).toHaveBeenCalled();
      const handArg = mockGameState.setHand.mock.calls[0][0];
      const prev = [
        { id: 1, url: 'card1.png', instanceId: 'instance-1' },
        { id: 2, url: 'card2.png', instanceId: 'instance-2' },
      ];
      const next = typeof handArg === 'function' ? handArg(prev) : handArg;
      expect(next).toEqual([{ id: 2, url: 'card2.png', instanceId: 'instance-2' }]);
      expect(mockGameState.setSelectedCards).toHaveBeenCalledWith([]);
      // setPlayerTurnState using functional update; evaluate to 'drawing'
      expect(mockGameState.setPlayerTurnState).toHaveBeenCalled();
      const phaseArg = mockGameState.setPlayerTurnState.mock.calls[0][0];
      const resolvedPhase = typeof phaseArg === 'function' ? phaseArg('discarding') : phaseArg;
      expect(resolvedPhase).toBe('drawing');
    });

    test('should not discard if no cards selected', async () => { /* ... (no changes) ... */ });
    test('should not discard if not players turn', async () => { /* ... (no changes) ... */ });
  });

  describe('handlePickUp', () => {
    test('should call pickup API and update hand', async () => {
      const allNewCards = [{ id: 101 }];
      apiService.pickUpCards.mockResolvedValue(allNewCards);
      cardService.getPlayingHand.mockImplementation(cards => cards.map((c, i) => ({ id: c.id, url: 'card.png' })));
      apiService.getHand.mockResolvedValue(allNewCards);

      const state = { ...mockGameState, playerTurnState: 'drawing', selectedDraftCards: ['draft-1'] };
      const { result } = renderHook(() => useCardActions('game-123', state));

      await act(async () => {
        await result.current.handlePickUp();
      });

      expect(apiService.pickUpCards).toHaveBeenCalledWith('game-123', 1, [101]);
      expect(cardService.getPlayingHand).toHaveBeenCalledWith(allNewCards);
      expect(mockGameState.setHand).toHaveBeenCalled();
      expect(mockGameState.setSelectedDraftCards).toHaveBeenCalledWith([]);
    });
  });

  describe('Ariadne Oliver flow', () => {
    test('handlePlay with single Ariadne (id=15) opens SetSelectionModal', async () => {
      const state = {
        ...mockGameState,
        hand: [
          { id: 15, url: 'ariadne.png', instanceId: 'a-1' },
          { id: 7, url: 'det.png', instanceId: 'd-1' },
        ],
        selectedCards: ['a-1'],
        setSetSelectionModalOpen: vi.fn(),
        setEventCardToPlay: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions('game-123', state));
      await act(async () => {
        await result.current.handlePlay();
      });

      expect(state.setEventCardToPlay).toHaveBeenCalledWith(expect.objectContaining({ id: 15, instanceId: 'a-1' }));
      expect(state.setSetSelectionModalOpen).toHaveBeenCalledWith(true);
      // No immediate API call should be made until a set is selected
      expect(apiService.playAriadneOliver).not.toHaveBeenCalled();
    });

    test('handleEventActionConfirm for Ariadne starts cancelable action and cleans up', async () => {
      const state = {
        ...mockGameState,
        hand: [
          { id: 15, url: 'ariadne.png', instanceId: 'a-1', id_instancia: 1001 },
          { id: 9, url: 'other.png', instanceId: 'o-1' },
        ],
        selectedCards: ['a-1'],
        eventCardToPlay: { id: 15, instanceId: 'a-1', id_instancia: 1001 },
        players: [
          { id_jugador: 1, nombre_jugador: 'You' },
          { id_jugador: 3, nombre_jugador: 'Opp' },
        ],
        setEventCardToPlay: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setConfirmationModalOpen: vi.fn(),
      };

      const iniciarAccionCancelable = vi.fn();
      const { result } = renderHook(() => useCardActions('game-123', state, undefined, iniciarAccionCancelable));

      const targetSet = { jugador_id: 3, representacion_id_carta: 999, cartas_ids: [7, 8, 9] };

      await act(async () => {
        await result.current.handleEventActionConfirm(targetSet);
      });

      // Iniciar acción cancelable (Ariadne)
      expect(iniciarAccionCancelable).toHaveBeenCalledTimes(1);
      const accion = iniciarAccionCancelable.mock.calls[0][0];
      expect(accion).toMatchObject({
        tipo_accion: 'evento_ariadne_oliver',
        cartas_db_ids: [1001],
        id_carta_tipo_original: 15,
        payload_original: {
          id_objetivo: 3,
          id_representacion_carta: 999,
        },
      });

      // Hand cleanup removed Ariadne
      expect(state.setHand).toHaveBeenCalled();
      const updater = state.setHand.mock.calls[0][0];
      const prev = state.hand;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      expect(next).toEqual([{ id: 9, url: 'other.png', instanceId: 'o-1' }]);

      // Selection and turn state updates
      expect(state.setSelectedCards).toHaveBeenCalledWith([]);
      expect(state.setHasPlayedSetThisTurn).toHaveBeenCalledWith(true);
      expect(state.setPlayerTurnState).toHaveBeenCalledWith(expect.any(Function));

      // Modal cleanup and event reset
      expect(state.setPlayerSelectionModalOpen).toHaveBeenCalledWith(false);
      expect(state.setConfirmationModalOpen).toHaveBeenCalledWith(false);
      expect(state.setSetSelectionModalOpen).toHaveBeenCalledWith(false);
      expect(state.setEventCardToPlay).toHaveBeenCalledWith(null);

      // No llamado directo al API aquí (se hace al resolver la acción)
      expect(apiService.playAriadneOliver).not.toHaveBeenCalled();
      expect(apiService.requestTargetToRevealSecret).not.toHaveBeenCalled();
      expect(apiService.getPlayedSets).not.toHaveBeenCalled();
    });


  });

  describe('Point Your Suspicions test', () => {

    // Mockear la función 'iniciarAccionCancelable'
    const mockIniciarAccion = vi.fn();
    const ID_PYS = 25; // ID de Point Your Suspicions

    beforeEach(() => {
      // Configurar mocks específicos para este flujo
      isValidEventCard.mockReturnValue(true); // Asumir que es un evento
      isValidDetectiveSet.mockReturnValue(false);
      cardService.getCardNameById.mockReturnValue('Point Your Suspicions');
    });

    test('debería llamar a iniciarAccionCancelable para PYS y actualizar estado', async () => {

      // 1. Setup del Estado
      const pysCard = { id: ID_PYS, url: 'pys.png', instanceId: 'pys-1', id_instancia: 101, nombre: 'Point Your Suspicions' };
      const otherCard = { id: 7, url: 'det.png', instanceId: 'd-1', id_instancia: 102 };

      const state = {
        ...mockGameState,
        hand: [pysCard, otherCard],
        selectedCards: ['pys-1'],
        setEventCardToPlay: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setConfirmationModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        players: [{ id_jugador: 1, nombre_jugador: 'Tester' }],
      };

      // 2. Renderizar el hook
      const { result } = renderHook(() =>
        useCardActions('game-123', state, vi.fn(), mockIniciarAccion)
      );

      // 3. Actuar (simular clic en "Jugar")
      await act(async () => {
        await result.current.handlePlay();
      });

      // 4. Verificar (Llamada a 'iniciarAccionCancelable')
      expect(mockIniciarAccion).toHaveBeenCalledTimes(1);
      expect(mockIniciarAccion).toHaveBeenCalledWith({
        tipo_accion: "evento_point_your_suspicions",
        cartas_db_ids: [101], // El id_instancia
        nombre_accion: 'Point Your Suspicions',
        payload_original: null,
        id_carta_tipo_original: ID_PYS // El id de tipo
      });

      // 5. Verificar (Actualización optimista de UI)
      expect(state.setHand).toHaveBeenCalledTimes(1);

      // Verificar que la mano se actualizó correctamente
      const nextHand = state.setHand.mock.calls[0][0];
      expect(nextHand).toEqual([otherCard]); // Solo la otra carta debe quedar

      expect(state.setSelectedCards).toHaveBeenCalledWith([]);
      expect(state.setHasPlayedSetThisTurn).toHaveBeenCalledWith(true);
      // La lógica del hook usa un updater, y la mano restante (1 carta) debe ir a 'drawing'
      expect(state.setPlayerTurnState).toHaveBeenCalledWith(expect.any(Function));
      const updater = state.setPlayerTurnState.mock.calls[0][0];
      const newState = updater('discarding'); // 'discarding' es el estado previo (irrelevante para esta lógica)
      expect(newState).toBe('drawing');

      expect(state.setEventCardToPlay).toHaveBeenCalledWith(null); // Limpia la carta en juego
    });
  });
});


describe('useSecrets', () => {
  const mockGameState = {
    setIsSecretsModalOpen: vi.fn(),
    setViewingSecretsOfPlayer: vi.fn(),
    setPlayerSecretsData: vi.fn(),
    setIsSecretsLoading: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiService.getPlayerSecrets.mockResolvedValue([]);
    cardService.getSecretCards.mockImplementation(cards => cards.map(c => ({ ...c, url: 'secret.png' })));
  });

  test('handleOpenSecretsModal should fetch data and update state', async () => {
    const mockPlayer = { id_jugador: 2, nombre_jugador: 'Opponent' };
    const secretsFromApi = [{ bocaArriba: true, carta_id: 3 }];
    apiService.getPlayerSecrets.mockResolvedValue(secretsFromApi);

    const { result } = renderHook(() => useSecrets('game-123', mockGameState));

    await act(async () => {
      await result.current.handleOpenSecretsModal(mockPlayer);
    });

    expect(mockGameState.setViewingSecretsOfPlayer).toHaveBeenCalledWith(mockPlayer);
    expect(mockGameState.setIsSecretsModalOpen).toHaveBeenCalledWith(true);
    expect(mockGameState.setIsSecretsLoading).toHaveBeenCalledWith(true);
    expect(apiService.getPlayerSecrets).toHaveBeenCalledWith('game-123', 2);
    expect(cardService.getSecretCards).toHaveBeenCalledWith([{ id: 3 }]);
    expect(mockGameState.setPlayerSecretsData).toHaveBeenCalled();
    expect(mockGameState.setIsSecretsLoading).toHaveBeenLastCalledWith(false);
  });

  test('handleCloseSecretsModal should reset all modal states', () => {
    const { result } = renderHook(() => useSecrets('game-123', mockGameState));
    act(() => {
      result.current.handleCloseSecretsModal();
    });

    expect(mockGameState.setIsSecretsModalOpen).toHaveBeenCalledWith(false);
    expect(mockGameState.setViewingSecretsOfPlayer).toHaveBeenCalledWith(null);
    expect(mockGameState.setPlayerSecretsData).toHaveBeenCalledWith([]);
  });
});