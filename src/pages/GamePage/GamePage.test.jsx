import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import GamePage from './GamePage';

// --- MOCK CUSTOM HOOKS AND CHILD COMPONENTS ---
const mockUseGameState = {
  hand: [], selectedCards: [], isLoading: false, players: [], turnOrder: [],
  isMyTurn: true, isDiscardButtonEnabled: false, currentPlayerId: 1,
  deckCount: 52, currentTurn: 1, hostId: 2, winners: null,
  asesinoGano: false, roles: {}, secretCards: [],
  setDeckCount: vi.fn(), setCurrentTurn: vi.fn(), setWinners: vi.fn(), setAsesinoGano: vi.fn(),
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
  default: ({ player }) => <div data-testid={`pod-${player.id_jugador}`}>{player.nombre_jugador}</div>,
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


// --- TESTS ---
describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state to a clean default for each test
    Object.assign(mockUseGameState, {
      hand: [], selectedCards: [], isLoading: false, players: [], turnOrder: [],
      isMyTurn: true, isDiscardButtonEnabled: false, currentPlayerId: 1,
      roles: { murdererId: null, accompliceId: null }
    });
  });

  test('should render cards and a disabled discard button', () => {
    mockUseGameState.hand = [{ id: 10, url: 'cardA.png', instanceId: 'h1' }];
    render(<GamePage />);
    expect(screen.getByTestId('card-cardA.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descartar/i })).toBeDisabled();
  });

  test('should enable discard button when isDiscardButtonEnabled is true', () => {
    mockUseGameState.isDiscardButtonEnabled = true;
    render(<GamePage />);
    expect(screen.getByRole('button', { name: /descartar/i })).toBeEnabled();
  });
  
  test('should render opponent pods based on display logic', () => {
    mockUseGameState.currentPlayerId = 1;
    mockUseGameState.players = [
      { id_jugador: 1, nombre_jugador: 'Me' },
      { id_jugador: 2, nombre_jugador: 'Opponent 1' },
      { id_jugador: 3, nombre_jugador: 'Opponent 2' },
    ];
    mockUseGameState.turnOrder = [1, 2, 3];
    render(<GamePage />);
    
    expect(screen.getByTestId('pod-2')).toBeInTheDocument();
    expect(screen.getByTestId('pod-3')).toBeInTheDocument();
    expect(screen.queryByTestId('pod-1')).not.toBeInTheDocument();
  });
});