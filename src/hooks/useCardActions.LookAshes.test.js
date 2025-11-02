import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCardActions from "@/hooks/useCardActions";

// Mock de apiService con export nombrado
vi.mock("@/services/apiService", () => ({
  apiService: {
    playLookIntoTheAshes: vi.fn(),
    getHand: vi.fn(),
    getDiscardPile: vi.fn(),
    discardCards: vi.fn(),
    pickUpCards: vi.fn(),
    playDetectiveSet: vi.fn(),
    playCardsOffTheTable: vi.fn(),
    playAnotherVictim: vi.fn(),
    getPlayerSecrets: vi.fn(),
  }
}));

vi.mock("@/services/cardService", () => ({
  cardService: {
    getPlayingHand: vi.fn(),
    getEventCardData: vi.fn(() => ({ url: 'test-url' })),
    getSecretCards: vi.fn(),
  }
}));

// Mock de las validaciones
vi.mock('@/utils/detectiveSetValidation', () => ({
  isValidDetectiveSet: vi.fn(() => false),
}));

vi.mock('@/utils/eventCardValidation', () => ({
  isValidEventCard: vi.fn(() => true),
}));

describe("🧠 useCardActions - Look Into The Ashes", () => {
  let apiService;
  let cardService;

  beforeEach(async () => {
    vi.clearAllMocks();
    global.alert = vi.fn();

    const apiModule = await import('@/services/apiService');
    apiService = apiModule.apiService;

    const cardModule = await import('@/services/cardService');
    cardService = cardModule.cardService;
  });

  describe("Primera parte - Jugar carta y abrir modal", () => {
    it("ejecuta la primera parte: juega la carta y obtiene 5 cartas del descarte", async () => {
      // Mock del descarte que devuelve la API
      const mockDiscardPile = [
        { id: 21, nombre: "Card trade" },
        { id: 22, nombre: "And then there was one more..." },
        { id: 25, nombre: "Point your suspicions" },
        { id: 21, nombre: "Card trade" },
        { id: 22, nombre: "And then there was one more..." }
      ];

      // Mock de las cartas procesadas para el modal
      const mockProcessedDiscardCards = [
        { id: 21, nombre: "Card trade", instanceId: "discard-selection-21-0", originalId: 21 },
        { id: 22, nombre: "And then there was one more...", instanceId: "discard-selection-22-1", originalId: 22 },
        { id: 25, nombre: "Point your suspicions", instanceId: "discard-selection-25-2", originalId: 25 },
        { id: 21, nombre: "Card trade", instanceId: "discard-selection-21-3", originalId: 21 },
        { id: 22, nombre: "And then there was one more...", instanceId: "discard-selection-22-4", originalId: 22 }
      ];

      // Configurar mocks de API
      apiService.playLookIntoTheAshes.mockResolvedValueOnce({});
      apiService.getDiscardPile.mockResolvedValueOnce(mockDiscardPile);
      cardService.getPlayingHand.mockImplementation((cards) =>
        mockProcessedDiscardCards.filter(processedCard =>
          cards.some(card => card.id === processedCard.originalId)
        )
      );

      const gameState = {
        gameId: 1,
        currentPlayerId: 1,
        players: [{ id_jugador: 1, nombre_jugador: "Andres" }],

        // Estado inicial - carta seleccionada para jugar
        hand: [
          { id: 20, instanceId: "look1", nombre: "Look Into The Ashes", id_instancia: 101 },
          { id: 7, instanceId: "card7", nombre: "Otra carta", id_instancia: 102 }
        ],
        selectedCards: ["look1"],

        // Estado del juego
        hasPlayedSetThisTurn: false,
        playerTurnState: "discarding",
        draftCards: [],
        selectedDraftCards: [],
        isMyTurn: true,

        // Setters
        setLookIntoAshesModalOpen: vi.fn(),
        setDiscardPileSelection: vi.fn(),
        setSelectedDiscardCard: vi.fn(),
        setEventCardToPlay: vi.fn(),
        setSelectedCards: vi.fn(),
        setHand: vi.fn(),
        setHasPlayedSetThisTurn: vi.fn(),
        setPlayerTurnState: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setEventCardInPlay: vi.fn(),
        setSelectedDraftCards: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions(1, gameState));
      console.log("🔍 Antes de ejecutar - hand:", gameState.hand);
      console.log("🔍 Antes de ejecutar - selectedCards:", gameState.selectedCards);
      // Ejecutar handleEventPlay que debería llamar a handleLookIntoTheAshes
      await act(async () => {
        await result.current.handlePlay();
      });
      console.log("🔍 Llamadas a playLookIntoTheAshes:", apiService.playLookIntoTheAshes.mock.calls);
      console.log("🔍 Llamadas a getDiscardPile:", apiService.getDiscardPile.mock.calls);
      console.log("🔍 Llamadas a setDiscardPileSelection:", gameState.setDiscardPileSelection.mock.calls);
      expect(apiService.playLookIntoTheAshes).toHaveBeenCalledWith(1, 1, 20, null);
      expect(apiService.getDiscardPile).toHaveBeenCalledWith(1, 1, 5);
      expect(gameState.setDiscardPileSelection).toHaveBeenCalled();
      expect(gameState.setEventCardToPlay).toHaveBeenCalledWith({ id: 20, instanceId: "look1", id_instancia: 101 });
      expect(gameState.setLookIntoAshesModalOpen).toHaveBeenCalledWith(true);
      expect(gameState.setSelectedDiscardCard).toHaveBeenCalledWith(null);
    });

    it("maneja errores en la primera parte", async () => {
      apiService.playLookIntoTheAshes.mockRejectedValueOnce(new Error("API Error"));

      const gameState = {
        gameId: 1,
        currentPlayerId: 1,
        players: [{ id_jugador: 1, nombre_jugador: "Andres" }],

        hand: [{ id: 20, instanceId: "look1" }],
        selectedCards: ["look1"],

        hasPlayedSetThisTurn: false,
        playerTurnState: "discarding",
        draftCards: [],
        selectedDraftCards: [],
        isMyTurn: true,

        // Setters
        setLookIntoAshesModalOpen: vi.fn(),
        setDiscardPileSelection: vi.fn(),
        setSelectedDiscardCard: vi.fn(),
        setEventCardToPlay: vi.fn(),
        setSelectedCards: vi.fn(),
        setHand: vi.fn(),
        setHasPlayedSetThisTurn: vi.fn(),
        setPlayerTurnState: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setEventCardInPlay: vi.fn(),
        setSelectedDraftCards: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions(1, gameState));

      await act(async () => {
        await result.current.handlePlay();
      });

      // Verificar que se limpió el estado del evento
      expect(gameState.setEventCardToPlay).toHaveBeenCalledWith(null);
      expect(gameState.setSelectedCards).toHaveBeenCalledWith([]);
    });
  });

  describe("Segunda parte - Confirmar carta seleccionada", () => {
    it("llama a la API con los parámetros correctos al confirmar", async () => {
      // 1. Arreglo en Mocks:
      apiService.playLookIntoTheAshes.mockResolvedValueOnce({});
      
      // Mock de getHand: DEBE devolver id_instancia
      const mockHandData = [{ id: 25, id_instancia: 201, nombre: "Carta de Prueba" }];
      apiService.getHand.mockResolvedValueOnce(mockHandData);
      
      // Mock de getPlayingHand: DEBE preservar los datos
      cardService.getPlayingHand.mockImplementation((cards) => cards);

      const gameState = {
        gameId: 1,
        currentPlayerId: 1,
        players: [{ id_jugador: 1, nombre_jugador: "Andres" }],

        selectedDiscardCard: "discard-selection-25-2",
        discardPileSelection: [
          { instanceId: "discard-selection-25-2", originalId: 25 }
        ],
        eventCardToPlay: { id: 20, instanceId: "look1", id_instancia: 101 },

        hand: [{ id: 20, instanceId: "look1", id_instancia: 101 }],
        selectedCards: ["look1"],

        hasPlayedSetThisTurn: false,
        playerTurnState: "playing",
        draftCards: [],
        selectedDraftCards: [],
        isMyTurn: true,

        // Setters
        setLookIntoAshesModalOpen: vi.fn(),
        setDiscardPileSelection: vi.fn(),
        setSelectedDiscardCard: vi.fn(),
        setHand: vi.fn(),
        setSelectedCards: vi.fn(),
        setHasPlayedSetThisTurn: vi.fn(),
        setPlayerTurnState: vi.fn(),
        setEventCardToPlay: vi.fn(),
        setSelectedDraftCards: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setEventCardInPlay: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions(1, gameState));

      // 2. Arreglo en 'act': Eliminar el 'act' anidado
      await act(async () => {
        await result.current.handleLookIntoTheAshesConfirm();
      });

      // 3. Asserts (ahora deberían pasar)
      expect(apiService.playLookIntoTheAshes).toHaveBeenCalledWith(1, 1, null, 25);
      expect(apiService.getHand).toHaveBeenCalledWith(1, 1);
      
      // 4. Arreglo en Assert: Comprobar el 'instanceId' correcto
      expect(gameState.setHand).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 25,
          id_instancia: 201,
          instanceId: "card-inst-201" 
        })
      ]);
      
      expect(gameState.setLookIntoAshesModalOpen).toHaveBeenCalledWith(false);
      expect(gameState.setDiscardPileSelection).toHaveBeenCalledWith([]);
      expect(gameState.setSelectedDiscardCard).toHaveBeenCalledWith(null);
      expect(gameState.setEventCardToPlay).toHaveBeenCalledWith(null);
    });

    it("funciona con IDs repetidos en el descarte", async () => {
      apiService.playLookIntoTheAshes.mockResolvedValueOnce({});
      apiService.getHand.mockResolvedValueOnce([{ id: 21, instanceId: "card-21" }]);
      cardService.getPlayingHand.mockReturnValue([{ id: 21, instanceId: "card-21" }]);

      const gameState = {
        gameId: 1,
        currentPlayerId: 1,
        players: [{ id_jugador: 1, nombre_jugador: "Andres" }],

        selectedDiscardCard: "discard-selection-21-0",
        discardPileSelection: [
          { instanceId: "discard-selection-21-0", originalId: 21 },
          { instanceId: "discard-selection-21-1", originalId: 21 } // Mismo ID
        ],
        eventCardToPlay: { id: 20, instanceId: "look1", id_instancia: 101 },

        hand: [{ id: 20, instanceId: "look1", id_instancia: 101 }],
        selectedCards: ["look1"],

        hasPlayedSetThisTurn: false,
        playerTurnState: "playing",
        draftCards: [],
        selectedDraftCards: [],
        isMyTurn: true,

        // Setters
        setLookIntoAshesModalOpen: vi.fn(),
        setDiscardPileSelection: vi.fn(),
        setSelectedDiscardCard: vi.fn(),
        setHand: vi.fn(),
        setSelectedCards: vi.fn(),
        setHasPlayedSetThisTurn: vi.fn(),
        setPlayerTurnState: vi.fn(),
        setEventCardToPlay: vi.fn(),
        setSelectedDraftCards: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setEventCardInPlay: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions(1, gameState));

      await act(async () => {
        await result.current.handleLookIntoTheAshesConfirm();
      });

      expect(apiService.playLookIntoTheAshes).toHaveBeenCalledWith(1, 1, null, 21);
    });

    it("no hace nada si no hay carta seleccionada en el modal", async () => {
      const gameState = {
        gameId: 1,
        currentPlayerId: 1,
        players: [{ id_jugador: 1, nombre_jugador: "Andres" }],

        selectedDiscardCard: null, // No hay carta seleccionada
        discardPileSelection: [
          { instanceId: "discard-selection-21-0", originalId: 21 }
        ],
        eventCardToPlay: { id: 20, instanceId: "look1", id_instancia: 101 },

        hand: [{ id: 20, instanceId: "look1", id_instancia: 101 }],
        selectedCards: ["look1"],

        hasPlayedSetThisTurn: false,
        playerTurnState: "playing",
        draftCards: [],
        selectedDraftCards: [],
        isMyTurn: true,

        // Setters
        setLookIntoAshesModalOpen: vi.fn(),
        setDiscardPileSelection: vi.fn(),
        setSelectedDiscardCard: vi.fn(),
        setHand: vi.fn(),
        setSelectedCards: vi.fn(),
        setHasPlayedSetThisTurn: vi.fn(),
        setPlayerTurnState: vi.fn(),
        setEventCardToPlay: vi.fn(),
        setSelectedDraftCards: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setEventCardInPlay: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions(1, gameState));

      await act(async () => {
        await result.current.handleLookIntoTheAshesConfirm();
      });

      expect(apiService.playLookIntoTheAshes).not.toHaveBeenCalled();
      expect(gameState.setLookIntoAshesModalOpen).not.toHaveBeenCalled();
    });

    it("maneja errores en la segunda parte", async () => {
      apiService.playLookIntoTheAshes.mockRejectedValueOnce(new Error("Network fail"));

      const gameState = {
        gameId: 1,
        currentPlayerId: 1,
        players: [{ id_jugador: 1, nombre_jugador: "Andres" }],

        selectedDiscardCard: "discard-selection-21-0",
        discardPileSelection: [
          { instanceId: "discard-selection-21-0", originalId: 21 }
        ],
        eventCardToPlay: { id: 20, instanceId: "look1", id_instancia: 101 },

        hand: [{ id: 20, instanceId: "look1", id_instancia: 101 }],
        selectedCards: ["look1"],

        hasPlayedSetThisTurn: false,
        playerTurnState: "playing",
        draftCards: [],
        selectedDraftCards: [],
        isMyTurn: true,

        // Setters
        setLookIntoAshesModalOpen: vi.fn(),
        setDiscardPileSelection: vi.fn(),
        setSelectedDiscardCard: vi.fn(),
        setHand: vi.fn(),
        setSelectedCards: vi.fn(),
        setHasPlayedSetThisTurn: vi.fn(),
        setPlayerTurnState: vi.fn(),
        setEventCardToPlay: vi.fn(),
        setSelectedDraftCards: vi.fn(),
        setPlayerSelectionModalOpen: vi.fn(),
        setSetSelectionModalOpen: vi.fn(),
        setEventCardInPlay: vi.fn(),
      };

      const { result } = renderHook(() => useCardActions(1, gameState));

      await act(async () => {
        await result.current.handleLookIntoTheAshesConfirm();
      });

      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Error al seleccionar carta/));
      expect(gameState.setLookIntoAshesModalOpen).toHaveBeenCalledWith(false);
      expect(gameState.setDiscardPileSelection).toHaveBeenCalledWith([]);
      expect(gameState.setSelectedDiscardCard).toHaveBeenCalledWith(null);
    });
  });
});