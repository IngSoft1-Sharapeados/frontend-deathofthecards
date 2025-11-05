import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PlayerSelectionModal from './PlayerSelectionModal';

// Mock del import de SVG para que Vitest no falle
vi.mock('@/assets/images/cards/misc/user-icon.svg', () => ({
  default: 'user-icon-path',
}));

describe('PlayerSelectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnPlayerSelect = vi.fn();
  const mockPlayers = [
    { id_jugador: 1, nombre_jugador: 'Jugador Uno' },
    { id_jugador: 2, nombre_jugador: 'Jugador Dos' },
  ];

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnPlayerSelect.mockClear();
  });

  test('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <PlayerSelectionModal isOpen={false} players={[]} onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renderiza el modal con título y jugadores cuando isOpen es true', () => {
    render(
      <PlayerSelectionModal isOpen={true} players={mockPlayers} onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
    );
    expect(screen.getByRole('heading', { name: 'Seleccionar Jugador' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jugador Uno/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jugador Dos/i })).toBeInTheDocument();
  });

  test('renderiza un título personalizado si se provee', () => {
    render(
      <PlayerSelectionModal isOpen={true} players={[]} title="Elige un objetivo" onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
    );
    expect(screen.getByRole('heading', { name: 'Elige un objetivo' })).toBeInTheDocument();
  });

  describe('Interacciones', () => {
    test('llama a onPlayerSelect con el ID correcto al hacer click en un jugador', () => {
      render(
        <PlayerSelectionModal isOpen={true} players={mockPlayers} onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
      );

      const playerTwoButton = screen.getByRole('button', { name: /Jugador Dos/i });
      fireEvent.click(playerTwoButton);

      expect(mockOnPlayerSelect).toHaveBeenCalledTimes(1);
      expect(mockOnPlayerSelect).toHaveBeenCalledWith(2); // ID del Jugador Dos
    });

    test('llama a onClose al hacer click en el botón "Cancelar"', () => {
      render(
        <PlayerSelectionModal isOpen={true} players={mockPlayers} onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('llama a onClose al hacer click en el overlay', () => {
      render(
        <PlayerSelectionModal isOpen={true} players={mockPlayers} onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
      );

      // El overlay es el contenedor padre directo del modal
      const overlay = screen.getByRole('heading').parentElement.parentElement;
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('NO llama a onClose al hacer click dentro del contenido del modal', () => {
      render(
        <PlayerSelectionModal isOpen={true} players={mockPlayers} onClose={mockOnClose} onPlayerSelect={mockOnPlayerSelect} />
      );

      const title = screen.getByRole('heading');
      fireEvent.click(title);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // --- INICIO DE LA MODIFICACIÓN (Nuevos Tests) ---
  describe('Estado de Carga (Loading State)', () => {
    test('muestra el mensaje de "loading" en lugar de la lista de jugadores', () => {
      render(
        <PlayerSelectionModal
          isOpen={true}
          players={mockPlayers}
          onClose={mockOnClose}
          onPlayerSelect={mockOnPlayerSelect}
          title="Votando..."
          loadingMessage="Esperando a los demás jugadores..."
        />
      );

      // 1. Debe mostrar el mensaje de loading
      expect(screen.getByText('Esperando a los demás jugadores...')).toBeInTheDocument();

      // 2. NO debe mostrar la lista de jugadores
      expect(screen.queryByRole('button', { name: /Jugador Uno/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Jugador Dos/i })).not.toBeInTheDocument();

      // 3. Debe seguir mostrando el título
      expect(screen.getByRole('heading', { name: 'Votando...' })).toBeInTheDocument();
    });

    test('oculta el botón "Cancelar" si hideCloseButton es true', () => {
      render(
        <PlayerSelectionModal
          isOpen={true}
          players={mockPlayers}
          onClose={mockOnClose}
          onPlayerSelect={mockOnPlayerSelect}
          loadingMessage="Esperando..."
          hideCloseButton={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Cancelar/i })).not.toBeInTheDocument();
    });

    test('NO oculta el botón "Cancelar" si hideCloseButton es false o undefined', () => {
      render(
        <PlayerSelectionModal
          isOpen={true}
          players={mockPlayers}
          onClose={mockOnClose}
          onPlayerSelect={mockOnPlayerSelect}
          loadingMessage="Esperando..."
        />
      );

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });
  });
});