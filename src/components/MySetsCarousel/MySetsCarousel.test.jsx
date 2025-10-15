import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi } from 'vitest';

import MySetsCarousel from './MySetsCarousel';

// Mock child Card component to make assertions simple
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`card-${imageName}`}>{imageName}</div>,
}));

// Mock cardService
vi.mock('@/services/cardService', () => ({
  cardService: {
    getPlayingHand: vi.fn((cards) => cards.map((c) => ({ id: c.id, url: `card-${c.id}.png` }))),
  },
}));

describe('MySetsCarousel', () => {
  test('renders nothing when no sets provided', () => {
    const { container } = render(<MySetsCarousel sets={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders cards for provided sets', () => {
    const mockSets = [{ id: 1 }, { id: 2 }];
    render(<MySetsCarousel sets={mockSets} />);

    expect(screen.getByTestId('card-card-1.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-card-2.png')).toBeInTheDocument();
  });

  test('pagination buttons work and show correct slice', () => {
    // Provide 5 sets so pagination is needed (visible=3)
    const mockSets = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    render(<MySetsCarousel sets={mockSets} />);

    const prevButton = screen.getByLabelText('Anterior');
    const nextButton = screen.getByLabelText('Siguiente');

    // Initially prev disabled, next enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Initial slice includes card-1
    expect(screen.getByTestId('card-card-1.png')).toBeInTheDocument();
    expect(screen.queryByTestId('card-card-5.png')).toBeNull();

    // Click next twice to reach the end
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Now next should be disabled and prev enabled
    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toBeDisabled();

    // Now last card should be visible and first not
    expect(screen.getByTestId('card-card-5.png')).toBeInTheDocument();
    expect(screen.queryByTestId('card-card-1.png')).toBeNull();
  });
});
