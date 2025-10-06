
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
    default: ({ imageName, ...props }) => (
      <div
        data-testid={`card-${imageName}`}
        onClick={props.onCardClick}
        className={props.isSelected ? 'selected' : ''}
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
    useNavigate: () => vi.fn(),
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

const renderComponent = (options = {}) => {
  // Usa vi.spyOn
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'playerId') {
      return options.playerId?.toString() || MOCK_PLAYER_ID.toString();
    }
    return null;
  });

  apiService.getHand.mockResolvedValue(MOCK_HAND_DATA_FROM_API);
  apiService.getTurn.mockResolvedValue(MOCK_PLAYER_ID);
  apiService.getDeckCount.mockResolvedValue(52);
  apiService.getTurnOrder.mockResolvedValue(MOCK_TURN_ORDER);
  apiService.getGameDetails.mockResolvedValue(MOCK_GAME_DETAILS);

  apiService.getMySecrets.mockResolvedValue(options.secretCards || []);
  cardService.getSecretCards.mockImplementation(secrets => secrets);
  apiService.getRoles.mockResolvedValue(options.roles || {});

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
        MOCK_PLAYER_ID,
        [10, 25]
      );
    });

    // Las cartas podrían seguir renderizadas mientras se actualiza el estado
    await waitFor(() => {
      expect(discardButton).toBeDisabled();
    });

    expect(screen.queryByTestId('card-cardA.png')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-cardB.png')).not.toBeInTheDocument();
    expect(discardButton).toBeDisabled();
  });

  test('should fetch and render secret cards on initial load', async () => {
    const MOCK_SECRET_CARDS_FROM_API = [
      { id: 6, url: '06-secret_front.png' },
      { id: 3, url: '03-secret_murderer.png' },
    ];

    apiService.getMySecrets.mockResolvedValue(MOCK_SECRET_CARDS_FROM_API);

    cardService.getSecretCards.mockImplementation(secrets => secrets);

    renderComponent({ secretCards: MOCK_SECRET_CARDS_FROM_API });

    await waitFor(() => {
      expect(screen.getByTestId('card-06-secret_front.png')).toBeInTheDocument();
      expect(screen.getByTestId('card-03-secret_murderer.png')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /tus secretos/i })).toBeInTheDocument();
  });

  describe('Role Emojis Visibility', () => {
    // Objeto simulado de la respuesta de la API /roles
    const MOCK_ROLES_DATA = { 'asesino-id': 2, 'complice-id': 3 };

    test('should show both emojis if the current player is the Murderer', async () => {
      // Simulamos que somos el jugador 2 (el asesino)
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(MOCK_HOST_ID.toString()); // MOCK_HOST_ID is 2

      // Renderizamos el componente pasándole los datos de los roles
      renderComponent({
        roles: MOCK_ROLES_DATA,
        playerId: MOCK_HOST_ID // MOCK_HOST_ID es 2
      });

      // Esperamos a que la lista de jugadores se renderice
      await waitFor(() => {
        expect(screen.getByText('Player Two (Host)')).toBeInTheDocument();
      });

      // Verificamos que el asesino (Player 2) tiene su emoji
      const murdererRow = screen.getByRole('row', { name: /Player Two \(Host\)/i });
      expect(murdererRow.textContent).toContain('🔪');

      // Verificamos que el cómplice (Player 3) tiene su emoji
      const accompliceRow = screen.getByRole('row', { name: /Player Three/i });
      expect(accompliceRow.textContent).toContain('🤝');

      // Verificamos que el detective (Player 1) no ve ningún emoji
      const detectiveRow = screen.getByRole('row', { name: /Player One \(You\)/i });
      expect(detectiveRow.textContent).not.toContain('🔪');
      expect(detectiveRow.textContent).not.toContain('🤝');
    });

    test('should show both emojis if the current player is the Accomplice', async () => {
      const MOCK_ROLES_DATA = { 'asesino-id': 2, 'complice-id': 3 };
      // Simulamos que somos el jugador 3 (el cómplice)
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('3');

      renderComponent({
        roles: MOCK_ROLES_DATA,
        playerId: 3
      });

      await waitFor(() => {
        expect(screen.getByText('Player Three')).toBeInTheDocument();
      });

      // Las verificaciones son las mismas, vistas desde la perspectiva del cómplice
      const murdererRow = screen.getByRole('row', { name: /Player Two \(Host\)/i });
      expect(murdererRow.textContent).toContain('🔪');

      const accompliceRow = screen.getByRole('row', { name: /Player Three/i });
      expect(accompliceRow.textContent).toContain('🤝');
    });

    test('should NOT show any emojis if the current player is a Detective', async () => {
      const MOCK_ROLES_DATA = { 'asesino-id': 2, 'complice-id': 3 };
      // Simulamos que somos el jugador 1 (un detective)
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(MOCK_PLAYER_ID.toString()); // MOCK_PLAYER_ID is 1

      renderComponent({
        roles: MOCK_ROLES_DATA,
        playerId: MOCK_PLAYER_ID // MOCK_PLAYER_ID es 1
      });

      await waitFor(() => {
        expect(screen.getByText('Player One (You)')).toBeInTheDocument();
      });

      // La forma más simple de verificar: los emojis no deben estar en ningún lugar del documento
      expect(screen.queryByText('🔪')).not.toBeInTheDocument();
      expect(screen.queryByText('🤝')).not.toBeInTheDocument();
    });
  });


});