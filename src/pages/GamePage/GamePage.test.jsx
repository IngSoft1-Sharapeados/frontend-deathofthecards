// Importa las funciones necesarias desde Vitest
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import GamePage from './GamePage';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';
import websocketService from '@/services/websocketService';

//----- MOCKS -----//

// Usa vi.mock en lugar de jest.mock
vi.mock('@/components/Card/Card', () => {
  return {
    default: ({ imageName, isSelected, onCardClick }) => (
      <div
        data-testid={`card-${imageName}`}
        onClick={onCardClick}
        className={isSelected ? 'selected' : ''}
      >
        {imageName}
      </div>
    )
  };
});

vi.mock('@/components/Deck/Deck.jsx', () => {
  return {
    default: ({ count }) => <div data-testid="deck">Deck: {count}</div>
  };
});

// Mockea los servicios usando vi.mock
vi.mock('@/services/apiService');
vi.mock('@/services/cardService');
vi.mock('@/services/websocketService');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
  };
});


//----- SETUP -----//

const MOCK_GAME_ID = '123';
const MOCK_PLAYER_ID = 1;
const MOCK_HOST_ID = 2;

const MOCK_HAND_DATA_FROM_API = [
  { id: 10, url: 'cardA.png' },
  { id: 25, url: 'cardB.png' },
];

const MOCK_GAME_DETAILS = {
  id_anfitrion: MOCK_HOST_ID,
  listaJugadores: [
    { id_jugador: 1, nombre_jugador: 'Player One (You)' },
    { id_jugador: 2, nombre_jugador: 'Player Two (Host)' },
    { id_jugador: 3, nombre_jugador: 'Player Three' },
  ],
};

const MOCK_TURN_ORDER = [2, 3, 1];

const renderComponent = () => {
  // Usa vi.spyOn
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'playerId') return MOCK_PLAYER_ID.toString();
    return null;
  });

  apiService.getHand.mockResolvedValue(MOCK_HAND_DATA_FROM_API);
  apiService.getTurn.mockResolvedValue(MOCK_PLAYER_ID);
  apiService.getDeckCount.mockResolvedValue(52);
  apiService.getTurnOrder.mockResolvedValue(MOCK_TURN_ORDER);
  apiService.getGameDetails.mockResolvedValue(MOCK_GAME_DETAILS);

  cardService.getPlayingHand.mockImplementation(hand => hand);

  render(<GamePage />);
};


//----- TESTS -----//

describe('GamePage', () => {
  beforeEach(() => {
    // Usa vi.clearAllMocks
    vi.clearAllMocks();
  });

  // El resto de tus pruebas no necesita cambios ya que usan `expect`, `screen`, etc.
  // que son parte de Vitest/Testing Library y no del objeto `jest`.





  test('should allow card selection and enable discard button when it is the current player\'s turn', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('card-cardA.png')).toBeInTheDocument();
    });

    const discardButton = screen.getByRole('button', { name: /descartar/i });
    expect(discardButton).toBeDisabled();

    const cardA = screen.getByTestId('card-cardA.png');
    fireEvent.click(cardA);

    expect(discardButton).toBeEnabled();
    expect(cardA).toHaveClass('selected');

    fireEvent.click(cardA);

    expect(discardButton).toBeDisabled();
    expect(cardA).not.toHaveClass('selected');
  });

  test('should NOT allow card selection when it is NOT the current player turn', async () => {
    apiService.getTurn.mockResolvedValue(2);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('card-cardA.png')).toBeInTheDocument();
    });

    const discardButton = screen.getByRole('button', { name: /descartar/i });
    expect(discardButton).toBeDisabled();

  });

  test('should handle discarding cards successfully', async () => {
    apiService.discardCards.mockResolvedValue({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('card-cardA.png')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('card-cardA.png'));
    fireEvent.click(screen.getByTestId('card-cardB.png'));

    const discardButton = screen.getByRole('button', { name: /descartar/i });
    expect(discardButton).toBeEnabled();
    fireEvent.click(discardButton);

    await waitFor(() => {
      expect(apiService.discardCards).toHaveBeenCalledWith(
        MOCK_GAME_ID,
        MOCK_PLAYER_ID.toString(),
        [10, 25]
      );
    });

    expect(screen.queryByTestId('card-cardA.png')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-cardB.png')).not.toBeInTheDocument();
    expect(discardButton).toBeDisabled();
  });


});