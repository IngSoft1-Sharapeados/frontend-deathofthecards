import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import EventDisplay from './EventDisplay';

// Mock del componente Card para aislar el test
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid="mock-card">{imageName}</div>,
}));

describe('EventDisplay', () => {
  const mockOnDisplayComplete = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers(); // Habilitamos el control manual de los timers (setTimeout)
    mockOnDisplayComplete.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers(); // Restauramos los timers reales
  });

  test('no renderiza nada si la prop "card" es null', () => {
    const { container } = render(<EventDisplay card={null} onDisplayComplete={mockOnDisplayComplete} />);
    expect(container.firstChild).toBeNull();
  });

  test('renderiza la carta y el overlay cuando se le pasa una carta', () => {
    const cardProp = { imageName: 'test-card.png' };
    render(<EventDisplay card={cardProp} onDisplayComplete={mockOnDisplayComplete} />);
    
    expect(screen.getByTestId('mock-card')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card')).toHaveTextContent('test-card.png');
  });

  test('renderiza el mensaje si se provee en la prop "card"', () => {
    const cardProp = { imageName: 'test-card.png', message: 'Evento Jugado' };
    render(<EventDisplay card={cardProp} onDisplayComplete={mockOnDisplayComplete} />);
    
    expect(screen.getByText('Evento Jugado')).toBeInTheDocument();
  });

  test('NO renderiza el mensaje si no se provee', () => {
    const cardProp = { imageName: 'test-card.png' };
    render(<EventDisplay card={cardProp} onDisplayComplete={mockOnDisplayComplete} />);
    
    expect(screen.queryByText('Evento Jugado')).not.toBeInTheDocument();
  });

  test('llama a onDisplayComplete después de 3 segundos', () => {
    const cardProp = { imageName: 'test-card.png' };
    render(<EventDisplay card={cardProp} onDisplayComplete={mockOnDisplayComplete} />);

    // Al inicio, la función no ha sido llamada
    expect(mockOnDisplayComplete).not.toHaveBeenCalled();

    // Avanzamos el tiempo 3000ms
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Ahora, la función debe haber sido llamada una vez
    expect(mockOnDisplayComplete).toHaveBeenCalledTimes(1);
  });
});