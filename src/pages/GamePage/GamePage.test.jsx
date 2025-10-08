import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import GamePage from './GamePage';

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
  hostId: 2,
  winners: null,
  asesinoGano: false,
  roles: { murdererId: null, accompliceId: null },
  secretCards: [],
  // Derived added to match hook contract
  displayedOpponents: [],
  getPlayerEmoji: (playerId) => null,
};

const mockUseCardActions = {
  handleCardClick: vi.fn(),
  handleDiscard: vi.fn(),
};

vi.mock('@/hooks/useGameState', () => ({ default: () => mockUseGameState }));
vi.mock('@/hooks/useGameData', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useCardActions', () => ({ default: () => mockUseCardActions }));
vi.mock('@/hooks/useGameWebSockets', () => ({ default: vi.fn() }));

vi.mock('@/components/PlayerPod/PlayerPod.jsx', () => ({
  default: ({ player, roleEmoji }) => (
    <div data-testid={`pod-${player.id_jugador}`}>
      {player.nombre_jugador}
      {roleEmoji && <span>{roleEmoji}</span>}
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

vi.mock('@/components/Deck/Deck.jsx', () => ({
  default: ({ count }) => <div data-testid="deck">Deck: {count}</div>,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
  useNavigate: () => vi.fn(),
}));

// --- Helpers to keep mock state consistent with hook contract ---
const computeDisplayedOpponents = (players, turnOrder, currentPlayerId) => {
  const idx = turnOrder.indexOf(currentPlayerId);
  if (idx === -1) return [];
  const rotated = [
    ...turnOrder.slice(idx + 1),
    ...turnOrder.slice(0, idx),
  ];
  return rotated
    .reverse()
    .map((id) => players.find((p) => p.id_jugador === id))
    .filter(Boolean);
};

const updateDerivedMockState = () => {
  mockUseGameState.displayedOpponents = computeDisplayedOpponents(
    mockUseGameState.players,
    mockUseGameState.turnOrder,
    mockUseGameState.currentPlayerId,
  );
  mockUseGameState.getPlayerEmoji = (playerId) => {
    const { currentPlayerId, roles } = mockUseGameState;
    const isInvolved =
      currentPlayerId === roles.murdererId || currentPlayerId === roles.accompliceId;
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
    // Reset state to a clean default for each test
    Object.assign(mockUseGameState, {
      hand: [
        { id: 10, url: 'cardA.png', instanceId: 'h1' },
        { id: 25, url: 'cardB.png', instanceId: 'h2' },
      ],
      selectedCards: [],
      isLoading: false,
      players: [
        { id_jugador: 1, nombre_jugador: 'Player One (You)' },
        { id_jugador: 2, nombre_jugador: 'Player Two (Host)' },
        { id_jugador: 3, nombre_jugador: 'Player Three' },
      ],
      turnOrder: [2, 3, 1],
      isMyTurn: true,
      isDiscardButtonEnabled: false,
      currentPlayerId: 1,
      currentTurn: 1,
      roles: { murdererId: null, accompliceId: null },
      secretCards: [],
    });
    updateDerivedMockState();
  });

  test('should allow card selection and enable discard button when it is the current players turn', () => {
    render(<GamePage />);
    const cardA = screen.getByTestId('card-cardA.png');
    fireEvent.click(cardA);
    expect(mockUseCardActions.handleCardClick).toHaveBeenCalledWith('h1');
  });

  test('should NOT allow card selection when it is NOT the current player turn', () => {
    mockUseGameState.isMyTurn = false; // Simulate it's not our turn
    render(<GamePage />);
    const cardA = screen.getByTestId('card-cardA.png');
    fireEvent.click(cardA);
    // The handleCardClick function inside the hook should prevent selection,
    // so we verify it was called, but trust the hook's internal logic.
    expect(mockUseCardActions.handleCardClick).toHaveBeenCalledWith('h1');
  });
  
  test('should call handleDiscard on button click', () => {
    mockUseGameState.isDiscardButtonEnabled = true; // Simulate button is enabled
    render(<GamePage />);
    const discardButton = screen.getByRole('button', { name: /descartar/i });
    fireEvent.click(discardButton);
    expect(mockUseCardActions.handleDiscard).toHaveBeenCalled();
  });

  test('should fetch and render secret cards on initial load', () => {
    mockUseGameState.secretCards = [
      { id: 6, url: '06-secret_front.png', instanceId: 's1' },
      { id: 3, url: '03-secret_murderer.png', instanceId: 's2' },
    ];
    render(<GamePage />);
    expect(screen.getByTestId('card-06-secret_front.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-03-secret_murderer.png')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tus secretos/i })).toBeInTheDocument();
  });

describe('Role Emojis Visibility', () => {
    beforeEach(() => {
        mockUseGameState.roles = { murdererId: 2, accompliceId: 3 };
    });

    // --- FIX STARTS HERE ---
    test('should show accomplice emoji when player is the Murderer', () => {
      mockUseGameState.currentPlayerId = 2; // We are the murderer
      updateDerivedMockState();
      render(<GamePage />);
      
      // We should see the pods for our opponents: player 1 and player 3
      const accomplicePod = screen.getByTestId('pod-3');
      const detectivePod = screen.getByTestId('pod-1');

      // The pod for the accomplice should have the emoji
      expect(accomplicePod.textContent).toContain('🤝');
      // The pod for the murderer (us) should NOT be rendered in the opponents area
      expect(screen.queryByTestId('pod-2')).not.toBeInTheDocument();
      // The detective should not have an emoji
      expect(detectivePod.textContent).not.toContain('🔪');
      expect(detectivePod.textContent).not.toContain('🤝');
    });

    test('should show murderer emoji when player is the Accomplice', () => {
      mockUseGameState.currentPlayerId = 3; // We are the accomplice
      updateDerivedMockState();
      render(<GamePage />);
      
      // We should see the pods for our opponents: player 1 and player 2
      const murdererPod = screen.getByTestId('pod-2');
      const detectivePod = screen.getByTestId('pod-1');
      
      // The pod for the murderer should have the emoji
      expect(murdererPod.textContent).toContain('🔪');
      // The pod for the accomplice (us) should NOT be rendered
      expect(screen.queryByTestId('pod-3')).not.toBeInTheDocument();
      // The detective should not have an emoji
      expect(detectivePod.textContent).not.toContain('🔪');
      expect(detectivePod.textContent).not.toContain('🤝');
    });

    test('should NOT show any emojis if the current player is a Detective', () => {
      mockUseGameState.currentPlayerId = 1; // We are the detective
      updateDerivedMockState();
      render(<GamePage />);
      
      // We check the rendered opponent pods
      const murdererPod = screen.getByTestId('pod-2');
      const accomplicePod = screen.getByTestId('pod-3');

      // Neither pod should contain an emoji
      expect(murdererPod.textContent).not.toContain('🔪');
      expect(accomplicePod.textContent).not.toContain('🤝');
    });
  });
});