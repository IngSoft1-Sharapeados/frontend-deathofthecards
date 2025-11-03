// useActionStack.test.js
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '@/services/apiService';
import useActionStack from '@/hooks/useActionStack'; // Asegúrate que la ruta sea correcta

// Mock del servicio de API
vi.mock('@/services/apiService', () => ({
  apiService: {
    playAnotherVictim: vi.fn(),
    playOneMore: vi.fn(),
    playEarlyTrainToPaddington: vi.fn(),
    playDelayTheMurdererEscape: vi.fn(),
    playDetectiveSet: vi.fn(),
    resolverAccion: vi.fn(),
    iniciarAccion: vi.fn(),
  },
}));

// Constantes para los tests
const MOCK_GAME_ID = 'game-123';
const MOCK_PLAYER_ID = 'player-fran';
const MOCK_OPPONENT_ID = 'player-opponent';
const NOT_SO_FAST_WINDOW_MS = 5000;
const OPPONENT_DELAY = NOT_SO_FAST_WINDOW_MS + 2000; // 7000

// Mock base de una acción recibida por WS (formato procesado)
const createMockAction = (playerId, tipo = 'evento_another_victim') => ({
  id_jugador_original: playerId,
  tipo_accion: tipo,
  payload_original: { data: 'test-payload' },
  cartas_originales_db_ids: [101],
  id_carta_tipo_original: 5,
  carta_original: {
    id_jugador: playerId,
    nombre: 'Test Action',
    id_carta_tipo: 5,
  },
  mensaje: 'Acción en progreso',
});

describe('useActionStack', () => {
  beforeEach(() => {
    // Limpiamos todos los mocks antes de cada test
    vi.clearAllMocks();
    // Usamos timers falsos para controlar setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restauramos los timers reales
    vi.useRealTimers();
  });

  test('should return initial state correctly', () => {
    const { result } = renderHook(() =>
      useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
    );

    expect(result.current.accionEnProgreso).toBeNull();
    expect(result.current.actionResultMessage).toBeNull();
    expect(typeof result.current.iniciarAccionCancelable).toBe('function');
    expect(typeof result.current.wsCallbacks).toBe('object');
  });

  // --- Tests de Callbacks de WebSocket ---
  describe('WebSocket Callbacks (wsCallbacks)', () => {
    test('onAccionEnProgreso should set accionEnProgreso state', () => {
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(MOCK_PLAYER_ID);

      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });

      expect(result.current.accionEnProgreso).toEqual(mockAction);
    });

    test('onPilaActualizada should also set accionEnProgreso state', () => {
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(MOCK_OPPONENT_ID);

      act(() => {
        result.current.wsCallbacks.onPilaActualizada({ data: mockAction });
      });

      expect(result.current.accionEnProgreso).toEqual(mockAction);
    });

    test('onAccionResuelta should clear accionEnProgreso and set result message', () => {
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(MOCK_PLAYER_ID);

      // 1. Poner una acción en progreso
      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });
      expect(result.current.accionEnProgreso).not.toBeNull();

      // 2. Resolver la acción
      act(() => {
        result.current.wsCallbacks.onAccionResuelta({
          detail: 'Acción Ejecutada',
        });
      });

      expect(result.current.accionEnProgreso).toBeNull();
      expect(result.current.actionResultMessage).toBe('Acción Ejecutada');
    });

    test('procesarAccionDesdeWS should build carta_original if missing', () => {
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const wsMessage = {
        mensaje: 'Acción sin procesar',
        data: {
          id_jugador_original: MOCK_PLAYER_ID,
          nombre_accion: 'Acción de Test',
          id_carta_tipo_original: 99,
          // ... otros datos
        },
      };

      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso(wsMessage);
      });

      expect(result.current.accionEnProgreso.carta_original).toBeDefined();
      expect(result.current.accionEnProgreso.carta_original.nombre).toBe(
        'Acción de Test'
      );
      expect(result.current.accionEnProgreso.carta_original.id_carta_tipo).toBe(
        99
      );
      expect(result.current.accionEnProgreso.mensaje).toBe(
        'Acción sin procesar'
      );
    });
  });

  // --- Test de la función iniciarAccionCancelable ---
  describe('iniciarAccionCancelable', () => {
    test('should call apiService.iniciarAccion with correct payload', async () => {
      apiService.iniciarAccion.mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const payload = { tipo: 'jugar_carta', id_carta: 50 };

      await act(async () => {
        await result.current.iniciarAccionCancelable(payload);
      });

      expect(apiService.iniciarAccion).toHaveBeenCalledWith(
        MOCK_GAME_ID,
        MOCK_PLAYER_ID,
        payload
      );
    });

    test('should alert on error if apiService.iniciarAccion rejects', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const error = new Error('Acción no permitida');
      apiService.iniciarAccion.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const payload = { tipo: 'jugar_carta', id_carta: 50 };

      await act(async () => {
        await result.current.iniciarAccionCancelable(payload);
      });

      expect(apiService.iniciarAccion).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(
        'Error al proponer la acción: Acción no permitida'
      );
      alertMock.mockRestore();
    });
  });

  // --- Test de la lógica principal (useEffect y timers) ---
  describe('Action Resolution Logic (useEffect)', () => {
    test('should execute OUR action after delay if decision is "ejecutar"', async () => {
      apiService.resolverAccion.mockResolvedValue({ decision: 'ejecutar' });
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(
        MOCK_PLAYER_ID,
        'evento_another_victim'
      );

      // 1. Iniciar la acción
      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });

      // 2. Avanzar el timer (nuestro delay)
      await act(async () => {
        vi.advanceTimersByTime(NOT_SO_FAST_WINDOW_MS);
      });

      // 3. Verificar que se llamó a resolverAccion
      expect(apiService.resolverAccion).toHaveBeenCalledWith(MOCK_GAME_ID);

      // 4. Esperar que se resuelva la promesa de resolverAccion
      await act(async () => {
        await Promise.resolve();
      });

      // 5. Verificar que se ejecutó la acción original
      expect(apiService.playAnotherVictim).toHaveBeenCalledWith(
        MOCK_GAME_ID,
        MOCK_PLAYER_ID,
        mockAction.id_carta_tipo_original,
        mockAction.payload_original
      );
    });

    test("should NOT execute OPPONENT's action after delay (even if decision is 'ejecutar')", async () => {
      apiService.resolverAccion.mockResolvedValue({ decision: 'ejecutar' });
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(
        MOCK_OPPONENT_ID, 
        'evento_another_victim'
      );

      // 1. Iniciar la acción
      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });

      // 2. Avanzar el timer (delay del oponente)
      await act(async () => {
        vi.advanceTimersByTime(OPPONENT_DELAY);
      });

      // 3. Verificar que se llamó a resolverAccion
      expect(apiService.resolverAccion).toHaveBeenCalledWith(MOCK_GAME_ID);

      // 4. Esperar que se resuelva la promesa
      await act(async () => {
        await Promise.resolve();
      });

      // 5. Verificar que NO se ejecutó la acción original
      expect(apiService.playAnotherVictim).not.toHaveBeenCalled();
    });

    test('should NOT execute OUR action if decision is NOT "ejecutar"', async () => {
      apiService.resolverAccion.mockResolvedValue({ decision: 'cancelada' }); // <-- Cancelada
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(
        MOCK_PLAYER_ID,
        'evento_another_victim'
      );
      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });

      await act(async () => {
        vi.advanceTimersByTime(NOT_SO_FAST_WINDOW_MS);
      });

      expect(apiService.resolverAccion).toHaveBeenCalledWith(MOCK_GAME_ID);

      await act(async () => {
        await Promise.resolve();
      });

      expect(apiService.playAnotherVictim).not.toHaveBeenCalled();
    });

    test('should clear timer if action is resolved (via WS) before timer ends', async () => {
      apiService.resolverAccion.mockResolvedValue({ decision: 'ejecutar' });
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );
      const mockAction = createMockAction(MOCK_PLAYER_ID);

      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });

      await act(async () => {
        vi.advanceTimersByTime(NOT_SO_FAST_WINDOW_MS / 2);
      });

      act(() => {
        result.current.wsCallbacks.onAccionResuelta({ detail: 'Cancelada' });
      });

      await act(async () => {
        vi.advanceTimersByTime(NOT_SO_FAST_WINDOW_MS);
      });

      expect(apiService.resolverAccion).not.toHaveBeenCalled();
      expect(result.current.accionEnProgreso).toBeNull();
      expect(result.current.actionResultMessage).toBe('Cancelada');
    });
  });

  // --- Test del switch de ejecutarAccionOriginal ---
  describe('ejecutarAccionOriginal switch', () => {
    // Función helper para testear el switch
    const testActionExecution = async (actionType, expectedServiceCall, payload) => {
      apiService.resolverAccion.mockResolvedValue({ decision: 'ejecutar' });
      
      const mockAction = createMockAction(MOCK_PLAYER_ID, actionType);
      if (payload) {
        mockAction.payload_original = payload;
      }
      
      const { result } = renderHook(() =>
        useActionStack(MOCK_GAME_ID, MOCK_PLAYER_ID)
      );

      act(() => {
        result.current.wsCallbacks.onAccionEnProgreso({ data: mockAction });
      });

      await act(async () => {
        vi.advanceTimersByTime(NOT_SO_FAST_WINDOW_MS);
        await Promise.resolve(); // Flush microtasks
      });

      expect(expectedServiceCall).toHaveBeenCalled();
    };

    test('should call playOneMore', async () => {
      const payload = { card: 5 };
      await testActionExecution('evento_one_more', apiService.playOneMore, payload);
      expect(apiService.playOneMore).toHaveBeenCalledWith(
        MOCK_GAME_ID, MOCK_PLAYER_ID, 5, payload
      );
    });

    test('should call playEarlyTrainToPaddington', async () => {
      await testActionExecution('evento_early_train', apiService.playEarlyTrainToPaddington, null);
      expect(apiService.playEarlyTrainToPaddington).toHaveBeenCalledWith(
        MOCK_GAME_ID, MOCK_PLAYER_ID, 5
      );
    });

     test('should call playDelayTheMurdererEscape', async () => {
      const payload = { cantidad: 2 };
      await testActionExecution('evento_delay_escape', apiService.playDelayTheMurdererEscape, payload);
      expect(apiService.playDelayTheMurdererEscape).toHaveBeenCalledWith(
        MOCK_GAME_ID, MOCK_PLAYER_ID, 5, 2
      );
    });

     test('should call playDetectiveSet', async () => {
      const payload = { set_cartas: [1, 2, 3] };
      await testActionExecution('jugar_set_detective', apiService.playDetectiveSet, payload);
      expect(apiService.playDetectiveSet).toHaveBeenCalledWith(
        MOCK_GAME_ID, MOCK_PLAYER_ID, [1, 2, 3]
      );
    });
  });
});