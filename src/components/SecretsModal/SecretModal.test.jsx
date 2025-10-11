import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import SecretsModal from './SecretsModal';

// Mock the child Card component to isolate the test to the modal itself
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`mock-card-${imageName}`}>Revealed Card</div>,
}));

describe('SecretsModal', () => {
  const mockPlayer = { nombre_jugador: 'Test Player' };
  const mockOnClose = vi.fn();
  const mockSecrets = [
    { id: 1, bocaArriba: true, url: 'revealed1.png' },
    { id: 2, bocaArriba: false },
    { id: 3, bocaArriba: false },
  ];

  beforeEach(() => {
    // Reset the mock function's call history before each test
    vi.clearAllMocks();
  });

  test('should not render anything when isOpen is false', () => {
    const { container } = render(<SecretsModal isOpen={false} onClose={mockOnClose} />);
    // The component should render null, so the container will be empty
    expect(container.firstChild).toBeNull();
  });

  test('should render the modal with title and player name when isOpen is true', () => {
    render(<SecretsModal isOpen={true} onClose={mockOnClose} player={mockPlayer} secrets={[]} />);
    expect(screen.getByRole('heading', { name: /Secretos de Test Player/i })).toBeInTheDocument();
  });

  test('should display the loading message when isLoading is true', () => {
    render(<SecretsModal isOpen={true} onClose={mockOnClose} isLoading={true} />);
    expect(screen.getByText('Cargando secretos...')).toBeInTheDocument();
  });

  test('should render the correct number of revealed and hidden cards', () => {
    render(<SecretsModal isOpen={true} onClose={mockOnClose} secrets={mockSecrets} />);
    
    // Check for the revealed card (rendered by our mock Card component)
    expect(screen.getByTestId('mock-card-revealed1.png')).toBeInTheDocument();

    // Check for the hidden cards (rendered as <img> tags)
    const hiddenCards = screen.getAllByAltText('Secreto oculto');
    expect(hiddenCards).toHaveLength(2);
  });

  describe('Closing behavior', () => {
    test('should call onClose when the close button is clicked', () => {
      render(<SecretsModal isOpen={true} onClose={mockOnClose} player={mockPlayer} secrets={[]} />);
      fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when the overlay is clicked', () => {
      render(<SecretsModal isOpen={true} onClose={mockOnClose} player={mockPlayer} secrets={[]} />);
      // The overlay is the parent of the modal content
      fireEvent.click(screen.getByRole('heading').parentElement.parentElement);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should NOT call onClose when the modal content itself is clicked', () => {
      render(<SecretsModal isOpen={true} onClose={mockOnClose} player={mockPlayer} secrets={[]} />);
      // Clicks inside the modal are stopped by e.stopPropagation()
      fireEvent.click(screen.getByRole('heading'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});