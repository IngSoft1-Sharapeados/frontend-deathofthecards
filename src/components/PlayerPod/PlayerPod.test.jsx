import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import PlayerPod from './PlayerPod';
import { cardService } from '@/services/cardService';
import styles from './PlayerPod.module.css';

// --- MOCKS (remain the same) ---
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`card-${imageName}`}>{imageName}</div>,
}));
vi.mock('@/services/cardService', () => ({
  cardService: {
    getRandomDetectives: vi.fn(),
  },
}));

// --- SETUP (remains the same) ---
const mockPlayer = { id_jugador: 2, nombre_jugador: 'Opponent' };
const mockDetectives = Array.from({ length: 7 }, (_, i) => ({
  id: 100 + i,
  url: `detective-${i}.png`,
}));

// --- TESTS ---
describe('PlayerPod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cardService.getRandomDetectives.mockReturnValue(mockDetectives);
  });

  test('should render player info and initial 3 sets', () => {
    render(<PlayerPod player={mockPlayer} />);
    expect(screen.getByText('Opponent')).toBeInTheDocument();
    expect(screen.getByTestId('card-detective-0.png')).toBeInTheDocument();
    expect(screen.queryByTestId('card-detective-3.png')).not.toBeInTheDocument();
  });

  // --- FIX: This is the single, corrected version of the test ---
  test('should apply current turn styles when isCurrentTurn is true', () => {
    render(<PlayerPod player={mockPlayer} isCurrentTurn={true} />);
    
    // Now it can find the element by its test ID
    const podElement = screen.getByTestId('player-pod');
    expect(podElement).toHaveClass(styles.currentTurn);
  });

  test('should display role emoji when provided', () => {
    render(<PlayerPod player={mockPlayer} roleEmoji="🔪" />);
    expect(screen.getByText('🔪')).toBeInTheDocument();
  });

  describe('Carousel Functionality', () => {
    // ... (the carousel tests were correct and remain the same)
    test('carousel scrolls to the next set of cards', () => {
      render(<PlayerPod player={mockPlayer} />);
      const rightArrow = screen.getByRole('button', { name: /Next Detective/i });
      fireEvent.click(rightArrow);
      expect(screen.queryByTestId('card-detective-0.png')).not.toBeInTheDocument();
      expect(screen.getByTestId('card-detective-3.png')).toBeInTheDocument();
    });

    test('carousel scrolls back to the previous set', () => {
      render(<PlayerPod player={mockPlayer} />);
      const rightArrow = screen.getByRole('button', { name: /Next Detective/i });
      fireEvent.click(rightArrow);
      const leftArrow = screen.getByRole('button', { name: /Previous Detective/i });
      fireEvent.click(leftArrow);
      expect(screen.getByTestId('card-detective-0.png')).toBeInTheDocument();
      expect(screen.queryByTestId('card-detective-3.png')).not.toBeInTheDocument();
    });
    
    test('should disable right arrow at the end of the list', () => {
        render(<PlayerPod player={mockPlayer} />);
        // Click through until we reach the end (7 cards, showing 3 at a time, can move 4 times)
        const rightArrow = screen.getByRole('button', { name: /Next detective/i });
        
        // Click 4 times to reach the end (indices 0->1->2->3->4, showing last 3 cards)
        fireEvent.click(rightArrow); // index 1
        fireEvent.click(rightArrow); // index 2
        fireEvent.click(rightArrow); // index 3
        fireEvent.click(rightArrow); // index 4 (showing cards 4, 5, 6)
        
        // At the end, the button should be disabled
        expect(rightArrow).toBeDisabled();
    });
  });
});