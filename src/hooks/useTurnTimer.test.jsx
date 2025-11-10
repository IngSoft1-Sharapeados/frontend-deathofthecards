import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTurnTimer, TURN_DURATION } from './useTurnTimer';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; 
import { useState } from 'react';

// Mocks
vi.mock('@/services/apiService');
vi.mock('@/services/cardService');

// Componente de prueba para renderizar el hook
const TestHost = ({ initialState = {} }) => {
  const [gameId] = useState(initialState.gameId || 'game-123');
  const [currentPlayerId] = useState(initialState.currentPlayerId || 'player-1');
  const [turnStartedAt, setTurnStartedAt] = useState(initialState.turnStartedAt || null);
  const [currentTurn] = useState(initialState.currentTurn || 1);
  const [hand] = useState(initialState.hand || [{ id: 1, id_instancia: 'card-inst-1' }]);
  const [isMyTurn] = useState(initialState.isMyTurn !== undefined ? initialState.isMyTurn : true);
  const [playerTurnState] = useState(initialState.playerTurnState || 'discarding');
  const setHand = initialState.setHand || vi.fn();

  const { timeLeft } = useTurnTimer({
    gameId,
    currentPlayerId,
    turnStartedAt,
    currentTurn,
    hand,
    setHand,
    isMyTurn,
    playerTurnState
  });

  return (
    <div>
      <div data-testid="timeLeft">{timeLeft}</div>
      <button onClick={() => setTurnStartedAt(Date.now())}>Iniciar Turno</button>
    </div>
  );
};

describe('useTurnTimer', () => {

  // Configuración de Mocks y Timers
  beforeEach(() => {
    vi.useFakeTimers(); // Controlamos el reloj
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z')); // Fijamos Date.now()
    vi.clearAllMocks();

    // Mockear las respuestas de la API
    apiService.discardCards.mockResolvedValue({});
    apiService.drawCards.mockResolvedValue({});
    
    // Mockeamos la mano que 'getHand' devuelve tras la penalización
    const mockNewHand = [{ id: 2, id_instancia: 'new-card-99' }];
    apiService.getHand.mockResolvedValue(mockNewHand);

    // Mockeamos la transformación de cardService
    cardService.getPlayingHand.mockImplementation((apiHand) => {
      return apiHand.map((card, index) => ({
        ...card,
        instanceId: `card-inst-${card.id_instancia}`
      }));
    });
  });

  afterEach(() => {
    vi.useRealTimers(); // Limpiar
  });

  // Test 1: Estado inicial
  it('muestra el tiempo completo (40s) por defecto si el turno no ha comenzado', () => {
    render(<TestHost />);
    expect(screen.getByTestId('timeLeft')).toHaveTextContent(String(TURN_DURATION));
  });

  // Test 2: Contador
  it('comienza a contar hacia atrás cuando inicia el turno', async () => {
    render(<TestHost />);
    
    // Capturar el tiempo inicial
    const startTime = Date.now();
    
    // Inicia el turno - esto captura Date.now() actual
    act(() => {
      fireEvent.click(screen.getByText('Iniciar Turno'));
    });
    
    // Esperar un tick para que el useEffect se ejecute
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(screen.getByTestId('timeLeft')).toHaveTextContent(String(TURN_DURATION));

    // Avanzamos SOLO el sistema de tiempo (Date.now)
    vi.setSystemTime(startTime + 3000);
    
    // Ahora avanzamos el interval para que se ejecute y calcule el nuevo timeLeft
    act(() => {
      vi.advanceTimersByTime(500); // Solo un tick del interval
    });

    // Después de 3 segundos, debe mostrar 37 (40 - 3)
    expect(screen.getByTestId('timeLeft')).toHaveTextContent('37');
  });

  // Test 3: Penalización
  it('aplica la penalización (discard, getHand, setHand, draw) cuando el tiempo llega a 0', async () => {
    const mockSetHand = vi.fn();
    render(<TestHost initialState={{ setHand: mockSetHand }} />);

    // Capturar el tiempo inicial
    const startTime = Date.now();

    // Inicia el turno
    act(() => {
      fireEvent.click(screen.getByText('Iniciar Turno'));
    });
    
    // Esperar un tick para que el useEffect se ejecute
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(screen.getByTestId('timeLeft')).toHaveTextContent(String(TURN_DURATION));

    // Avanzamos Date.now() 40 segundos en el futuro
    vi.setSystemTime(startTime + 40000);
    
    // Ejecutar el interval para que detecte el tiempo = 0
    act(() => {
      vi.advanceTimersByTime(500); // Solo un tick del interval
    });

    // El timer debe estar en 0
    expect(screen.getByTestId('timeLeft')).toHaveTextContent('0');

    // Dar tiempo para que las Promises se resuelvan
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Verificar que se ejecutaron las llamadas a la API
    expect(apiService.discardCards).toHaveBeenCalledTimes(1);
    expect(apiService.getHand).toHaveBeenCalledTimes(1);
    
    const expectedNewHand = [{
      id: 2,
      id_instancia: 'new-card-99',
      instanceId: 'card-inst-new-card-99'
    }];
    expect(mockSetHand).toHaveBeenCalledWith(expectedNewHand);
    expect(apiService.drawCards).toHaveBeenCalledTimes(1);
  });

  // Test 4: No penaliza si no es mi turno
  it('no aplica penalización si el tiempo llega a 0 pero no es mi turno', async () => {
    // Establecemos un turnStartedAt fijo usando el tiempo del sistema
    const fixedTime = Date.now();
    
    render(<TestHost initialState={{ 
      isMyTurn: false, 
      turnStartedAt: fixedTime 
    }} />);

    // Avanzamos el reloj 40 segundos
    await act(async () => {
      vi.advanceTimersByTime(40000);
    });

    // Esperamos un momento para asegurarnos de que no se ejecuta nada
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Verificamos que NO se llamó a ninguna API
    expect(apiService.discardCards).not.toHaveBeenCalled();
    expect(apiService.drawCards).not.toHaveBeenCalled();
    expect(apiService.getHand).not.toHaveBeenCalled();
  });

  // Test 5: No descarta si la mano está vacía
  it('omite el descarte si la mano está vacía (y no pasa el turno por el bug del hook)', async () => {
    const mockSetHand = vi.fn();
    const fixedTime = Date.now();
    
    render(<TestHost initialState={{ 
      hand: [], 
      setHand: mockSetHand,
      turnStartedAt: fixedTime
    }} />);

    // Avanzamos el reloj 40 segundos
    await act(async () => {
      vi.advanceTimersByTime(40000);
    });

    // Esperamos un momento extra
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Verificamos que NO se llamó a ninguna API porque hand.length === 0
    expect(apiService.discardCards).not.toHaveBeenCalled();
    expect(apiService.drawCards).not.toHaveBeenCalled();
    expect(apiService.getHand).not.toHaveBeenCalled();
  });
});