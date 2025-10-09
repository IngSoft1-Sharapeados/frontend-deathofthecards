import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import GamePage from './GamePage';
import { fireEvent } from '@testing-library/react';

// --- MOCK CUSTOM HOOKS AND CHILD COMPONENTS ---
const mockUseGameState = {
  hand: [],
  selectedCards: [],
  isLoading: false,
  players: [],
  turnOrder: [],
  isMyTurn: true,
  isDiscardButtonEnabled: false,
  currentPlayerId: 1,
  deckCount: 52,
  currentTurn: 1,
  roles: { murdererId: null, accompliceId: null },
  secretCards: [],
  playerTurnState: 'discarding',
  draftCards: [],
  selectedDraftCards: [],
  isPickupButtonEnabled: false,
  isPlayButtonEnabled: false,
  displayedOpponents: [],
  getPlayerEmoji: () => null,
  setDeckCount: vi.fn(),
  setCurrentTurn: vi.fn(),
  setDraftCards: vi.fn(),
  setWinners: vi.fn(),
  setAsesinoGano: vi.fn(),
};

const mockUseCardActions = {
  handleCardClick: vi.fn(),
  handleDraftCardClick: vi.fn(),
  handleDiscard: vi.fn(),
  handlePickUp: vi.fn(),
  handlePlay: vi.fn(),
};

vi.mock('@/hooks/useGameState', () => ({ default: () => mockUseGameState }));
vi.mock('@/hooks/useGameData', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useCardActions', () => ({ default: () => mockUseCardActions }));
vi.mock('@/hooks/useGameWebSockets', () => ({ default: vi.fn() }));

// FIX: Correctly mock react-router-dom to export its hooks
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/components/PlayerPod/PlayerPod.jsx', () => ({
  default: ({ player, roleEmoji }) => (
    <div data-testid={`pod-${player.id_jugador}`}>
      {player.nombre_jugador}
      {roleEmoji}
    </div>
  ),
}));

vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName, isSelected, onCardClick }) => (
    <div data-testid={`card-${imageName}`} onClick={onCardClick} className={isSelected ? 'selected' : ''}>
      {imageName}
    </div>
  ),
}));

vi.mock('@/components/CardDraft/CardDraft.jsx', () => ({
  default: ({ cards, onCardClick }) => (
    <div data-testid="card-draft">
      {cards.map(card => (
        <div key={card.instanceId} data-testid={`draft-card-${card.url}`} onClick={() => onCardClick(card.instanceId)}>
          {card.url}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/Deck/Deck.jsx', () => ({
  default: ({ count }) => <div data-testid="deck">Deck: {count}</div>,
}));

// FIX: Add helper functions back into the test file
const computeDisplayedOpponents = (players, turnOrder, currentPlayerId) => {
  const idx = turnOrder.indexOf(currentPlayerId);
  if (idx === -1) return [];
  const rotated = [...turnOrder.slice(idx + 1), ...turnOrder.slice(0, idx)];
  return rotated.reverse().map((id) => players.find((p) => p.id_jugador === id)).filter(Boolean);
};

const updateDerivedMockState = () => {
  mockUseGameState.displayedOpponents = computeDisplayedOpponents(
    mockUseGameState.players,
    mockUseGameState.turnOrder,
    mockUseGameState.currentPlayerId,
  );
  mockUseGameState.getPlayerEmoji = (playerId) => {
    const { currentPlayerId, roles } = mockUseGameState;
    const isInvolved = currentPlayerId === roles.murdererId || currentPlayerId === roles.accompliceId;
    if (!isInvolved || !roles.murdererId) return null;
    if (playerId === roles.murdererId) return '🔪';
    if (playerId === roles.accompliceId) return '🤝';
    return null;
  };
};

// --- TESTS ---
describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockUseGameState, {
      hand: [
        { id: 25, url: 'cardB.png', instanceId: 'h2' },
        { id: 10, url: 'cardA.png', instanceId: 'h1' },
      ],
      draftCards: [
        { id: 101, url: 'draftA.png', instanceId: 'd1' },
      ],
      selectedCards: [],
      selectedDraftCards: [],
      isLoading: false,
      players: [
        { id_jugador: 1, nombre_jugador: 'You' },
        { id_jugador: 2, nombre_jugador: 'Opponent' },
        { id_jugador: 3, nombre_jugador: 'Opponent2' },
      ],
      turnOrder: [2, 3, 1],
      isMyTurn: true,
      isDiscardButtonEnabled: false,
      isPickupButtonEnabled: false,
      currentPlayerId: 1,
      currentTurn: 1,
      playerTurnState: 'discarding',
      roles: { murdererId: null, accompliceId: null },
      secretCards: [],
    });
    updateDerivedMockState();
  });

  test('should render the hand sorted by card ID', () => {
    render(<GamePage />);
    const handContainer = screen.getByTestId('hand-container');
    const cards = handContainer.children;
    expect(cards[0].textContent).toContain('cardA.png'); // id: 10
    expect(cards[1].textContent).toContain('cardB.png'); // id: 25
  });

  test('should call handleCardClick when a hand card is clicked', () => {
    render(<GamePage />);
    fireEvent.click(screen.getByTestId('card-cardA.png'));
    expect(mockUseCardActions.handleCardClick).toHaveBeenCalledWith('h1');
  });

  test('renders Play button disabled when selection invalid', () => {
    render(<GamePage />);
    const playButton = screen.getByRole('button', { name: /jugar/i });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toBeDisabled();
  });

  test('should call handleDraftCardClick when a draft card is clicked', () => {
    mockUseGameState.playerTurnState = 'drawing';
    render(<GamePage />);
    fireEvent.click(screen.getByTestId('draft-card-draftA.png'));
    expect(mockUseCardActions.handleDraftCardClick).toHaveBeenCalledWith('d1');
  });

  describe('Turn Phase Actions', () => {
    test('should show "Descartar" button and call handleDiscard during discarding phase', () => {
      mockUseGameState.playerTurnState = 'discarding';
      mockUseGameState.isDiscardButtonEnabled = true;
      render(<GamePage />);
      const discardButton = screen.getByRole('button', { name: /descartar/i });
      expect(discardButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /levantar/i })).not.toBeInTheDocument();
      fireEvent.click(discardButton);
      expect(mockUseCardActions.handleDiscard).toHaveBeenCalled();
    });

    test('should show "Levantar" button and call handlePickUp during drawing phase', () => {
      mockUseGameState.playerTurnState = 'drawing';
      mockUseGameState.isPickupButtonEnabled = true;
      render(<GamePage />);
      const pickupButton = screen.getByRole('button', { name: /levantar/i });
      expect(pickupButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /descartar/i })).not.toBeInTheDocument();
      fireEvent.click(pickupButton);
      expect(mockUseCardActions.handlePickUp).toHaveBeenCalled();
    });
  });

  describe('Role Emojis Visibility', () => {
    beforeEach(() => {
      mockUseGameState.roles = { murdererId: 2, accompliceId: 3 };
    });

    test('should show accomplice emoji when player is the Murderer', () => {
      mockUseGameState.currentPlayerId = 2;
      updateDerivedMockState(); // Recalculate derived state
      render(<GamePage />);
      const accomplicePod = screen.getByTestId('pod-3');
      expect(accomplicePod.textContent).toContain('🤝');
      expect(screen.queryByTestId('pod-2')).not.toBeInTheDocument();
    });

    test('should show murderer emoji when player is the Accomplice', () => {
      mockUseGameState.currentPlayerId = 3;
      updateDerivedMockState(); // Recalculate derived state
      render(<GamePage />);
      const murdererPod = screen.getByTestId('pod-2');
      expect(murdererPod.textContent).toContain('🔪');
      expect(screen.queryByTestId('pod-3')).not.toBeInTheDocument();
    });

    test('should NOT show any emojis if the current player is a Detective', () => {
      mockUseGameState.currentPlayerId = 1;
      updateDerivedMockState(); // Recalculate derived state
      render(<GamePage />);
      const murdererPod = screen.getByTestId('pod-2');
      const accomplicePod = screen.getByTestId('pod-3');
      expect(murdererPod.textContent).not.toContain('🔪');
      expect(accomplicePod.textContent).not.toContain('🤝');
    });
  });
});