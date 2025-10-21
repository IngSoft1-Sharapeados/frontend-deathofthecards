import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi } from 'vitest';
import MySecretsCarousel from './MySecretsCarousel';

// Mock Card component
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName, subfolder }) => (
    <div data-testid={`card-${imageName}`} data-subfolder={subfolder}>
      {imageName}
    </div>
  ),
}));

const mockSecrets = [
  { instanceId: 's1', url: 'secret1.png', isRevealed: true },
  { instanceId: 's2', url: 'secret2.png', isRevealed: false },
  { instanceId: 's3', url: 'secret3.png', isRevealed: true },
  { instanceId: 's4', url: 'secret4.png', isRevealed: false },
  { instanceId: 's5', url: 'secret5.png', isRevealed: false },
];

describe('MySecretsCarousel', () => {
  test('renders null when no secret cards provided', () => {
    const { container } = render(<MySecretsCarousel secretCards={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders secret cards without navigation buttons when less than or equal to 3 cards', () => {
    const cards = mockSecrets.slice(0, 3);
    render(<MySecretsCarousel secretCards={cards} />);
    
    expect(screen.getByTestId('card-secret1.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret2.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret3.png')).toBeInTheDocument();
    
    expect(screen.queryByLabelText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Siguiente')).not.toBeInTheDocument();
  });

  test('renders navigation buttons when more than 3 cards', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    
    expect(screen.getByLabelText('Anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Siguiente')).toBeInTheDocument();
  });

  test('shows first 3 cards initially', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    
    expect(screen.getByTestId('card-secret1.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret2.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret3.png')).toBeInTheDocument();
    expect(screen.queryByTestId('card-secret4.png')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-secret5.png')).not.toBeInTheDocument();
  });

  test('previous button is disabled at start', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    const prevButton = screen.getByLabelText('Anterior');
    expect(prevButton).toBeDisabled();
  });

  test('next button navigates forward', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    const nextButton = screen.getByLabelText('Siguiente');
    
    fireEvent.click(nextButton);
    
    // After clicking next, we should see cards 2, 3, 4
    expect(screen.queryByTestId('card-secret1.png')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-secret2.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret3.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret4.png')).toBeInTheDocument();
    expect(screen.queryByTestId('card-secret5.png')).not.toBeInTheDocument();
  });

  test('previous button navigates backward', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    const nextButton = screen.getByLabelText('Siguiente');
    const prevButton = screen.getByLabelText('Anterior');
    
    // Navigate forward first
    fireEvent.click(nextButton);
    expect(screen.getByTestId('card-secret4.png')).toBeInTheDocument();
    
    // Navigate back
    fireEvent.click(prevButton);
    expect(screen.getByTestId('card-secret1.png')).toBeInTheDocument();
    expect(screen.queryByTestId('card-secret4.png')).not.toBeInTheDocument();
  });

  test('next button is disabled at the end', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    const nextButton = screen.getByLabelText('Siguiente');
    
    // Navigate to the end (5 cards, visible 3, max index is 2)
    fireEvent.click(nextButton); // index 1
    fireEvent.click(nextButton); // index 2
    
    expect(nextButton).toBeDisabled();
    expect(screen.getByTestId('card-secret3.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret4.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret5.png')).toBeInTheDocument();
  });

  test('previous button becomes enabled after navigating forward', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    const prevButton = screen.getByLabelText('Anterior');
    const nextButton = screen.getByLabelText('Siguiente');
    
    expect(prevButton).toBeDisabled();
    
    fireEvent.click(nextButton);
    expect(prevButton).toBeEnabled();
  });

  test('cards have correct subfolder prop', () => {
    render(<MySecretsCarousel secretCards={mockSecrets.slice(0, 2)} />);
    
    const card1 = screen.getByTestId('card-secret1.png');
    expect(card1).toHaveAttribute('data-subfolder', 'secret-cards');
  });

  test('navigates through all cards sequentially', () => {
    render(<MySecretsCarousel secretCards={mockSecrets} />);
    const nextButton = screen.getByLabelText('Siguiente');
    
    // Start: cards 1, 2, 3
    expect(screen.getByTestId('card-secret1.png')).toBeInTheDocument();
    
    // Click 1: cards 2, 3, 4
    fireEvent.click(nextButton);
    expect(screen.queryByTestId('card-secret1.png')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-secret2.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret4.png')).toBeInTheDocument();
    
    // Click 2: cards 3, 4, 5
    fireEvent.click(nextButton);
    expect(screen.queryByTestId('card-secret2.png')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-secret3.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret5.png')).toBeInTheDocument();
  });

  test('handles exactly 4 cards (edge case)', () => {
    const fourCards = mockSecrets.slice(0, 4);
    render(<MySecretsCarousel secretCards={fourCards} />);
    
    const nextButton = screen.getByLabelText('Siguiente');
    expect(nextButton).toBeEnabled();
    
    fireEvent.click(nextButton);
    expect(nextButton).toBeDisabled();
    
    // Should show cards 2, 3, 4
    expect(screen.getByTestId('card-secret2.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret3.png')).toBeInTheDocument();
    expect(screen.getByTestId('card-secret4.png')).toBeInTheDocument();
  });

  test('renders correctly with exactly 1 card', () => {
    const oneCard = mockSecrets.slice(0, 1);
    render(<MySecretsCarousel secretCards={oneCard} />);
    
    expect(screen.getByTestId('card-secret1.png')).toBeInTheDocument();
    expect(screen.queryByLabelText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Siguiente')).not.toBeInTheDocument();
  });

  test('shows eye overlay only on revealed secrets', () => {
    // Use 3 so all are visible
    render(<MySecretsCarousel secretCards={mockSecrets.slice(0, 3)} />);

    const overlays = screen.getAllByLabelText('Revelado');
    expect(overlays.length).toBe(2); // first and third are revealed
  });
});
