import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import React from 'react';
import useGameState from '@/hooks/useGameState';
import useCardActions from '@/hooks/useCardActions';
import CardTradeModal from '@/components/EventModals/CardTrade/CardTradeModal';
import { apiService } from '@/services/apiService'; 
import '@testing-library/jest-dom';

// --- Mocks --- //
vi.mock('@/services/apiService', () => ({
  apiService: {
    sendCard: vi.fn(() => Promise.resolve({ status: 'ok' })),
  },
}));

vi.mock('@/components/Card/Card', () => ({
  default: vi.fn(({ imageName, onCardClick }) => (
    <div
      data-testid="mock-card"
      data-image={imageName}
      onClick={onCardClick}
    >
      {imageName}
    </div>
  )),
}));

// --- Componente de prueba que monta los hooks en un contexto React --- //
function TestWrapper() {
  const gameState = useGameState();
  const cardActions = useCardActions(
    99, // gameId
    gameState,
    vi.fn(), // onSetEffectTrigger
    vi.fn()  // iniciarAccionCancelable
  );

  // Configurar estado inicial simulado
  React.useEffect(() => {
    gameState.setCardTradeModalOpen(true);
    gameState.setCardTradeContext({ originId: 7, targetPlayerId: 3 });
    gameState.setCurrentPlayerId(5);
  }, []);

  const hand = [
    { id_instancia: 1, url: 'card1.png', instanceId: 'card-inst-1', id: 10 },
    { id_instancia: 2, url: 'card2.png', instanceId: 'card-inst-2', id: 11 },
  ];

  return (
    <CardTradeModal
      isOpen={true}
      hand={hand}
      onClose={vi.fn()}
      onConfirm={(selectedId) =>
        cardActions.handleSendCardTradeResponse(selectedId)
      }
    />
  );
}

describe('Integración flujo completo Card Trade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe ejecutar todo el flujo cardTrade → modal → sendCard', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    const cards = await screen.findAllByTestId('mock-card');
    expect(cards).toHaveLength(2);

    // El usuario selecciona la segunda carta (con id_instancia = 2
    await user.click(cards[1]);
    await user.click(screen.getByText('Confirmar'));

    // Esperamos la llamada al endpoint simulado
    await waitFor(() => {
      expect(apiService.sendCard).toHaveBeenCalledWith(
        99, // gameId
        5,  // currentPlayerId
        2, // id de instancia de carta seleccionada
        7   // originId del intercambio
      );
    });
  });
  // Caso específico para verificar que se elimina solo la carta jugada
  it('debe eliminar solo la instancia específica de carta al confirmar trade', async () => {
    const user = userEvent.setup();
    
    // Mock de setHand para verificar qué se elimina
    const mockSetHand = vi.fn();
    
    function TestWrapperWithHandMock() {
      const gameState = useGameState();
      const cardActions = useCardActions(
        99,
        gameState,
        vi.fn(),
        vi.fn()
      );

      // Sobrescribir setHand con nuestro mock
      React.useEffect(() => {
        gameState.setHand = mockSetHand;
        gameState.setCardTradeModalOpen(true);
        gameState.setCardTradeContext({ originId: 7, targetPlayerId: 3 });
        gameState.setCurrentPlayerId(5);
      }, []);

      const hand = [
        { id_instancia: 1, url: 'card1.png', instanceId: 'card-inst-1', id: 10 },
        { id_instancia: 2, url: 'card2.png', instanceId: 'card-inst-2', id: 10 }, // Mismo id, diferente instancia
        { id_instancia: 3, url: 'card3.png', instanceId: 'card-inst-3', id: 11 },
      ];

      return (
        <CardTradeModal
          isOpen={true}
          hand={hand}
          onClose={vi.fn()}
          onConfirm={(selectedId) => cardActions.handleSendCardTradeResponse(selectedId)}
        />
      );
    }

    render(<TestWrapperWithHandMock />);

    const cards = await screen.findAllByTestId('mock-card');
    expect(cards).toHaveLength(3);

    // Seleccionar la carta con id_instancia = 2 (que tiene id = 10)
    await user.click(cards[1]);
    await user.click(screen.getByText('Confirmar'));

    // Verificar que se llamó a sendCard con la instancia correcta
    await waitFor(() => {
      expect(apiService.sendCard).toHaveBeenCalledWith(
        99, 5, 2, 7
      );
    });
  });

  //  Caso cuando el jugador actual es el origin (debería enviar al target)
  it('debe enviar carta al targetPlayerId cuando currentPlayer es el origin', async () => {
    const user = userEvent.setup();
    
    function TestWrapperOriginPlayer() {
      const gameState = useGameState();
      const cardActions = useCardActions(
        99,
        gameState,
        vi.fn(),
        vi.fn()
      );

      React.useEffect(() => {
        gameState.setCardTradeModalOpen(true);
        // En este caso, currentPlayerId ES el originId
        gameState.setCardTradeContext({ originId: 5, targetPlayerId: 3 });
        gameState.setCurrentPlayerId(5);
      }, []);

      const hand = [
        { id_instancia: 1, url: 'card1.png', instanceId: 'card-inst-1', id: 10 },
      ];

      return (
        <CardTradeModal
          isOpen={true}
          hand={hand}
          onClose={vi.fn()}
          onConfirm={(selectedId) => cardActions.handleSendCardTradeResponse(selectedId)}
        />
      );
    }

    render(<TestWrapperOriginPlayer />);

    const cards = await screen.findAllByTestId('mock-card');
    await user.click(cards[0]);
    await user.click(screen.getByText('Confirmar'));

    await waitFor(() => {
      expect(apiService.sendCard).toHaveBeenCalledWith(
        99, // gameId
        5,  // currentPlayerId (sender)
        1,  // id_instancia
        3   // destinationId (targetPlayerId)
      );
    });
  });
});