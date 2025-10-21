import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi } from 'vitest';

import CardDraft from './CardDraft';

// Mock child components
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`card-${imageName}`}>{imageName}</div>,
}));

// Mock draft cards data (as would be passed from parent component via API)
const mockDraftCards = [
  { id: 101, url: 'draft-card-1.png', instanceId: '101-draft-0' },
  { id: 102, url: 'draft-card-2.png', instanceId: '102-draft-1' },
  { id: 103, url: 'draft-card-3.png', instanceId: '103-draft-2' },
];

describe('CardDraft', () => {
  test('should render cards passed as props', () => {
    const mockOnCardClick = vi.fn();
    render(<CardDraft cards={mockDraftCards} onCardClick={mockOnCardClick} />);

    // Check that all cards are rendered
    expect(screen.getByTestId('card-draft-card-1.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-draft-card-2.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-draft-card-3.png')).toBeInTheDocument();
  });

  test('should not render any cards when empty array is provided', () => {
    const { container } = render(<CardDraft cards={[]} onCardClick={vi.fn()} />);
    expect(container.querySelectorAll('[data-testid^="card-"]').length).toBe(0);
  });
});
