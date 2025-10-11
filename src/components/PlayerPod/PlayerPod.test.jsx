import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import PlayerPod from './PlayerPod';
import { cardService } from '@/services/cardService';
import styles from './PlayerPod.module.css';

// Mock Card to avoid image imports/URLs and make querying deterministic
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`card-${imageName}`}>{imageName}</div>,
}));

// Mock cardService to control getPlayingHand mapping
vi.mock('@/services/cardService', () => ({
  cardService: {
    getPlayingHand: vi.fn(),
  },
}));

const mockPlayer = { id_jugador: 2, nombre_jugador: 'Opponent' };
const mockSets = [
  { id: 7 },
  { id: 8 },
  { id: 9 },
  { id: 10 },
  { id: 11 },
  { id: 12 },
  { id: 13 },
];

describe('PlayerPod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Map incoming ids to pretend card objects with url strings
    cardService.getPlayingHand.mockImplementation((arr) =>
      arr.map(({ id }) => ({ id, url: `detective-${id}.png` }))
    );
  });

  test('renders player info and first 3 set cards when sets provided', () => {
    render(<PlayerPod player={mockPlayer} sets={mockSets} />);
    expect(screen.getByText('Opponent')).toBeInTheDocument();
    // Should show first 3
    expect(screen.getByTestId('card-detective-7.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-detective-8.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-detective-9.png')).toBeInTheDocument();
    // Next one should not be visible yet
    expect(screen.queryByTestId('card-detective-10.png')).not.toBeInTheDocument();
  });

  test('applies current turn styles when isCurrentTurn is true', () => {
    render(<PlayerPod player={mockPlayer} sets={mockSets} isCurrentTurn={true} />);
    const podElement = screen.getByTestId('player-pod');
    expect(podElement).toHaveClass(styles.currentTurn);
  });

  test('displays role emoji when provided', () => {
    render(<PlayerPod player={mockPlayer} sets={mockSets} roleEmoji="🔪" />);
    expect(screen.getByText('🔪')).toBeInTheDocument();
  });

  describe('Carousel', () => {
    test('navigates to next and previous sets', () => {
      render(<PlayerPod player={mockPlayer} sets={mockSets} />);
      const nextBtn = screen.getByRole('button', { name: /next detective/i });
      fireEvent.click(nextBtn); // index becomes 1, shows ids 8,9,10
      expect(screen.queryByTestId('card-detective-7.png')).not.toBeInTheDocument();
      expect(screen.getByTestId('card-detective-10.png')).toBeInTheDocument();

      const prevBtn = screen.getByRole('button', { name: /previous detective/i });
      fireEvent.click(prevBtn); // back to 0, shows 7,8,9
      expect(screen.getByTestId('card-detective-7.png')).toBeInTheDocument();
      expect(screen.queryByTestId('card-detective-10.png')).not.toBeInTheDocument();
    });

    test('disables next button at end of list', () => {
      render(<PlayerPod player={mockPlayer} sets={mockSets} />);
      const nextBtn = screen.getByRole('button', { name: /next detective/i });
      // 7 cards, visible 3 => last start index is 4; click 4 times
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      expect(nextBtn).toBeDisabled();
      // At end, last visible includes id 13
      expect(screen.getByTestId('card-detective-13.png')).toBeInTheDocument();
    });
  });
});