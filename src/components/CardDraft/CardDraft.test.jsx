import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import CardDraft from './CardDraft';
import { cardService } from '@/services/cardService';

// Mock child components and services
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`card-${imageName}`}>{imageName}</div>,
}));

vi.mock('@/services/cardService', () => ({
  cardService: {
    getRandomGameCards: vi.fn(),
  },
}));

// Mock data to be returned by the service
const mockDraftCards = [
  { id: 101, url: 'draft-card-1.png' },
  { id: 102, url: 'draft-card-2.png' },
  { id: 103, url: 'draft-card-3.png' },
];

describe('CardDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure our mock function returns the mock data
    cardService.getRandomGameCards.mockReturnValue(mockDraftCards);
  });

  test('should render the title and fetch 3 cards on mount', async () => {
    render(<CardDraft />);
    
    // Check that the title is there
    expect(screen.getByRole('heading', { name: /draft/i })).toBeInTheDocument();

    // Check that the service was called to get the cards
    expect(cardService.getRandomGameCards).toHaveBeenCalledWith(3);

    // Wait for the component to render the cards after the useEffect hook runs
    await waitFor(() => {
      expect(screen.getByTestId('card-draft-card-1.png')).toBeInTheDocument();
      expect(screen.getByTestId('card-draft-card-2.png')).toBeInTheDocument();
      expect(screen.getByTestId('card-draft-card-3.png')).toBeInTheDocument();
    });
  });
});
