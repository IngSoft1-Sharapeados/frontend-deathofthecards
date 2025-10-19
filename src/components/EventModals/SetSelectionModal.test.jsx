import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SetSelectionModal from './SetSelectionModal';
import { cardService } from '@/services/cardService';

// Mock del componente Card para simplificar el test
vi.mock('@/components/Card/Card', () => ({
  default: ({ imageName }) => <div data-testid={`mock-card-${imageName}`}>{imageName}</div>
}));

// Mock del cardService para controlar la salida de getPlayingHand
vi.mock('@/services/cardService', () => ({
  cardService: {
    getPlayingHand: vi.fn((cards) =>
      cards.map(card => ({ id: card.id, url: `url-for-id-${card.id}.png` }))
    ),
  },
}));

describe('SetSelectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSetSelect = vi.fn();
  
  const mockPlayers = [
    { id_jugador: 2, nombre_jugador: 'Jugador Oponente' },
    { id_jugador: 3, nombre_jugador: 'Otro Jugador' },
  ];

  const mockOpponentSets = {
    '2': [ // Sets del Jugador Oponente
      { jugador_id: 2, representacion_id_carta: 8, cartas_ids: [8, 8, 14] },
    ],
    '3': [ // Set del Otro Jugador
      { jugador_id: 3, representacion_id_carta: 10, cartas_ids: [10, 10] },
    ],
  };

  beforeEach(() => {
    // Limpiamos los mocks antes de cada test
    mockOnClose.mockClear();
    mockOnSetSelect.mockClear();
    cardService.getPlayingHand.mockClear();
  });

  test('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <SetSelectionModal isOpen={false} players={[]} opponentSets={{}} onClose={mockOnClose} onSetSelect={mockOnSetSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renderiza el mensaje de "no hay sets" cuando opponentSets está vacío', () => {
    render(
      <SetSelectionModal isOpen={true} players={mockPlayers} opponentSets={{}} onClose={mockOnClose} onSetSelect={mockOnSetSelect} />
    );
    expect(screen.getByText('Ningún oponente ha jugado sets.')).toBeInTheDocument();
  });

  test('renderiza los nombres de los jugadores y sus sets correctamente', () => {
    render(
      <SetSelectionModal isOpen={true} players={mockPlayers} opponentSets={mockOpponentSets} onClose={mockOnClose} onSetSelect={mockOnSetSelect} />
    );
    
    // Verifica que los nombres de los jugadores se muestran
    expect(screen.getByRole('heading', { name: 'Jugador Oponente' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Otro Jugador' })).toBeInTheDocument();

    // Verifica que el servicio fue llamado para obtener la URL de la imagen de cada set
    expect(cardService.getPlayingHand).toHaveBeenCalledWith([{ id: 8 }]);
    expect(cardService.getPlayingHand).toHaveBeenCalledWith([{ id: 10 }]);

    // Verifica que las cartas representativas se renderizan
    expect(screen.getByTestId('mock-card-url-for-id-8.png')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-url-for-id-10.png')).toBeInTheDocument();
  });

  describe('Interacciones del Usuario', () => {
    test('llama a onSetSelect con el objeto de set correcto al hacer click', () => {
      render(
        <SetSelectionModal isOpen={true} players={mockPlayers} opponentSets={mockOpponentSets} onClose={mockOnClose} onSetSelect={mockOnSetSelect} />
      );
      
      // Buscamos el div que envuelve la carta del set y le hacemos click
      const setCardElement = screen.getByTestId('mock-card-url-for-id-10.png');
      fireEvent.click(setCardElement.parentElement); // El onClick está en el div padre

      // Verificamos que el callback fue llamado con el objeto de set correcto
      expect(mockOnSetSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSetSelect).toHaveBeenCalledWith(mockOpponentSets['3'][0]);
    });

    test('llama a onClose al hacer click en el botón "Cancelar"', () => {
      render(
        <SetSelectionModal isOpen={true} players={mockPlayers} opponentSets={mockOpponentSets} onClose={mockOnClose} onSetSelect={mockOnSetSelect} />
      );
      
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('llama a onClose al hacer click en el overlay', () => {
      render(
        <SetSelectionModal isOpen={true} players={mockPlayers} opponentSets={mockOpponentSets} onClose={mockOnClose} onPlayerSelect={mockOnSetSelect} />
      );
      
      const overlay = screen.getByRole('heading', { name: /Seleccionar un Set/i }).parentElement.parentElement;
      fireEvent.click(overlay);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('NO llama a onClose al hacer click dentro del modal', () => {
      render(
        <SetSelectionModal isOpen={true} players={mockPlayers} opponentSets={mockOpponentSets} onClose={mockOnClose} onPlayerSelect={mockOnSetSelect} />
      );
      
      fireEvent.click(screen.getByRole('heading', { name: /Jugador Oponente/i }));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});