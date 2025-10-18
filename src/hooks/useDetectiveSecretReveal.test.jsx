import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import useDetectiveSecretReveal from '@/hooks/useDetectiveSecretReveal.jsx';
import { apiService } from '@/services/apiService';
import websocketService from '@/services/websocketService';

vi.mock('@/services/apiService', () => ({
  apiService: {
    getPlayerSecrets: vi.fn(),
    revealSecret: vi.fn(),
    hideSecret: vi.fn(),
    requestTargetToRevealSecret: vi.fn(),
  }
}));

vi.mock('@/services/websocketService', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
  }
}));

// Mock Card to avoid asset dependencies and make clicks simpler
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`mock-card-${imageName || 'revealed'}`}>Card</div>,
}));

// Minimal host component to exercise the hook
function Host({ players, gameId = '1', gameState }) {
  const { modals, handleSetPlayedEvent } = useDetectiveSecretReveal(gameId, gameState, players);
  return (
    <div>
      <button onClick={() => handleSetPlayedEvent({ jugador_id: gameState.currentPlayerId, representacion_id: 7 })}>
        trigger-detective
      </button>
      {modals}
    </div>
  );
}

describe('useDetectiveSecretReveal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('abre el modal de selección de jugador al jugar set de detective', () => {
    const gameState = { currentPlayerId: 1, playersSecrets: {} };
    const players = [ { id_jugador: 1, nombre_jugador: 'Yo' }, { id_jugador: 2, nombre_jugador: 'Alice' }];

    render(<Host players={players} gameState={gameState} />);
    fireEvent.click(screen.getByText('trigger-detective'));
    // Debe mostrar el título del modal de selección
    expect(screen.getByText(/Selecciona un jugador/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('flujo detective: seleccionar objetivo, cargar secretos y confirmar revelar', async () => {
    const gameState = { currentPlayerId: 1, playersSecrets: {} };
    const players = [ { id_jugador: 1, nombre_jugador: 'Yo' }, { id_jugador: 2, nombre_jugador: 'Alice' }];
    apiService.getPlayerSecrets.mockResolvedValueOnce([
      { id: 100, bocaArriba: false },
    ]);
    apiService.revealSecret.mockResolvedValueOnce({});

    render(<Host players={players} gameState={gameState} />);
    // trigger detective
    fireEvent.click(screen.getByText('trigger-detective'));
    // select player Alice
    fireEvent.click(screen.getByText('Seleccionar'));

    // Should open Secrets modal (title includes player name)
    await waitFor(() => expect(screen.getByRole('heading', { name: /Secretos de Alice/i })).toBeInTheDocument());

    // Select hidden secret by clicking on hidden image
    const hidden = screen.getAllByAltText('Secreto oculto')[0];
    fireEvent.click(hidden);

    // Confirm reveal
    const revealBtn = await screen.findByRole('button', { name: /Revelar secreto/i });
    fireEvent.click(revealBtn);

  // Backend expects target player's id for id_jugador
  expect(apiService.revealSecret).toHaveBeenCalledWith('1', 2, 100);
  });

  it('flujo parker: seleccionar objetivo, cargar secretos revelados y confirmar ocultar', async () => {
    const gameState = { currentPlayerId: 1, playersSecrets: { 2: { revealed: 1, hidden: 0 } } };
    const players = [ { id_jugador: 1, nombre_jugador: 'Yo' }, { id_jugador: 2, nombre_jugador: 'Alice' }];
    apiService.getPlayerSecrets.mockResolvedValueOnce([
      { id: 101, bocaArriba: true, carta_id: 3, url: '03-secret_murderer.png' },
    ]);
    apiService.hideSecret.mockResolvedValueOnce({});

    // Host triggers parker by using representacion_id 10
    function HostParker({ players, gameState }) {
      const { modals, handleSetPlayedEvent } = useDetectiveSecretReveal('1', gameState, players);
      return (
        <div>
          <button onClick={() => handleSetPlayedEvent({ jugador_id: gameState.currentPlayerId, representacion_id: 10 })}>
            trigger-parker
          </button>
          {modals}
        </div>
      );
    }

    render(<HostParker players={players} gameState={gameState} />);
    fireEvent.click(screen.getByText('trigger-parker'));
    // select player Alice (has revealed)
    fireEvent.click(await screen.findByText('Seleccionar'));

    // Should open Secrets modal for Alice
    await waitFor(() => expect(screen.getByRole('heading', { name: /Secretos de Alice/i })).toBeInTheDocument());

    // For revealed, our Card mock renders a div; click anywhere in container by clicking the mock card (bubbles)
    const card = screen.getByTestId('mock-card-03-secret_murderer.png');
    fireEvent.click(card);

    const hideBtn = await screen.findByRole('button', { name: /Ocultar secreto/i });
    fireEvent.click(hideBtn);
  // Backend expects target player's id for id_jugador
  expect(apiService.hideSecret).toHaveBeenCalledWith('1', 2, 101);
  });
  
});
