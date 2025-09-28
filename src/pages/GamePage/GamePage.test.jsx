import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GamePage from '@/pages/GamePage/GamePage.jsx';
import { MemoryRouter } from 'react-router-dom';
import { cardService } from '@/services/cardService';
import { apiService } from '@/services/apiService';

// Mocks
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName, isSelected, onCardClick }) => (
    <div data-testid={`card-${imageName}`} data-selected={isSelected} onClick={() => onCardClick(imageName)}>
      {imageName}
    </div>
  )
}));
vi.mock('@/services/cardService', () => ({
  cardService: {
    getRandomHand: vi.fn()
  }
}));
vi.mock('@/services/apiService', () => ({
  apiService: {
    getGameDetails: vi.fn()
  }
}));

const mockHand = ['carta1', 'carta2', 'carta3'];
const mockPlayers = [
  { id_jugador: 1, nombre_jugador: 'Jugador1' },
  { id_jugador: 2, nombre_jugador: 'Jugador2' }
];

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.setItem('playerId', '1');
  cardService.getRandomHand.mockReturnValue(mockHand);
  apiService.getGameDetails.mockResolvedValue({ listaJugadores: mockPlayers });
});

describe('GamePage', () => {
  it('renderiza las cartas de la mano', async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    for (const card of mockHand) {
      expect(await screen.findByTestId(`card-${card}`)).toBeInTheDocument();
    }
  });

  it('permite seleccionar y deseleccionar cartas', async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    const card = await screen.findByTestId('card-carta1');
    expect(card.getAttribute('data-selected')).toBe('false');
    await userEvent.click(card);
    expect(card.getAttribute('data-selected')).toBe('true');
    await userEvent.click(card);
    expect(card.getAttribute('data-selected')).toBe('false');
  });

  it('habilita el botón de descartar solo si hay cartas seleccionadas', async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    const discardBtn = screen.getByRole('button', { name: /descartar/i });
    expect(discardBtn).toBeDisabled();
    await userEvent.click(screen.getByTestId('card-carta1'));
    expect(discardBtn).toBeEnabled();
  });

  it('descarta las cartas seleccionadas al hacer click en el botón', async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByTestId('card-carta1'));
    const discardBtn = screen.getByRole('button', { name: /descartar/i });
    await userEvent.click(discardBtn);
    expect(screen.queryByTestId('card-carta1')).not.toBeInTheDocument();
  });

});
