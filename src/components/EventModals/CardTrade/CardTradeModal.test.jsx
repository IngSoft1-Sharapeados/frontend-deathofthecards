import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardTradeModal from './CardTradeModal';
import '@testing-library/jest-dom';

vi.mock('@/components/Card/Card', () => ({
  default: vi.fn(({ imageName, subfolder, isDisabled, onCardClick }) => {
    return (
      <div 
        data-testid="mock-card" 
        data-image={imageName}
        data-disabled={isDisabled}
        onClick={onCardClick}
      >
        {imageName}
      </div>
    );
  })
}));

describe('CardTradeModal', () => {
  const mockHand = [
    {
      instanceId: 'card-inst-1',
      id_instancia: 1,
      url: 'card1.png',
      id: 10
    },
    {
      instanceId: 'card-inst-2', 
      id_instancia: 2,
      url: 'card2.png',
      id: 11
    },
    {
      instanceId: 'card-inst-3',
      id_instancia: 3, 
      url: 'card3.png',
      id: 12
    }
  ];

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <CardTradeModal 
        isOpen={false}
        hand={mockHand}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText('Selecciona una carta para intercambiar')).not.toBeInTheDocument();
  });

  it('should render modal with correct title and instructions when open', () => {
    render(
      <CardTradeModal 
        isOpen={true}
        hand={mockHand}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Selecciona una carta para intercambiar')).toBeInTheDocument();
    expect(screen.getByText('Elige una carta de tu mano para entregar al otro jugador.')).toBeInTheDocument();
  });

  it('should display all cards from hand', () => {
    render(
      <CardTradeModal 
        isOpen={true}
        hand={mockHand}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cards = screen.getAllByTestId('mock-card');
    expect(cards).toHaveLength(3);
    
    // Verificar que se muestran las URLs correctas
    expect(cards[0]).toHaveAttribute('data-image', 'card1.png');
    expect(cards[1]).toHaveAttribute('data-image', 'card2.png');
    expect(cards[2]).toHaveAttribute('data-image', 'card3.png');
  });

  it('should allow selecting a card', async () => {
    const user = userEvent.setup();
    
    render(
      <CardTradeModal 
        isOpen={true}
        hand={mockHand}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cards = screen.getAllByTestId('mock-card');
    
    // Seleccionar primera carta
    await user.click(cards[0]);
    
    // El botón de confirmar debería estar habilitado
    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).not.toBeDisabled();
  });

  it('should call onConfirm with selected card ID when confirm button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CardTradeModal 
        isOpen={true}
        hand={mockHand}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cards = screen.getAllByTestId('mock-card');
    await user.click(cards[1]); // Seleccionar segunda carta
    
    const confirmButton = screen.getByText('Confirmar');
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(2);
  });

  it('should have confirm button disabled when no card is selected', () => {
    render(
      <CardTradeModal 
        isOpen={true}
        hand={mockHand}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).toBeDisabled();
  });

  it('should handle empty hand gracefully', () => {
    render(
      <CardTradeModal 
        isOpen={true}
        hand={[]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cards = screen.queryAllByTestId('mock-card');
    expect(cards).toHaveLength(0);
    
    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).toBeDisabled();
  });
});