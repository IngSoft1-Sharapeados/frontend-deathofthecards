import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import GameOverModal from '@/components/GameOver/GameOverModal.jsx';
import { apiService } from '@/services/apiService';

// Línea clave: Le decimos a Vitest que use los "matchers" de jest-dom
expect.extend(matchers);

// Mock del apiService
vi.mock('@/services/apiService', () => ({
  apiService: {
    getRoles: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GameOverModal', () => {
  const mockOnReturnToMenu = vi.fn();
  const mockSetRoles = vi.fn();

  const defaultProps = {
    winners: ['Jugador1'],
    asesinoGano: false,
    onReturnToMenu: mockOnReturnToMenu,
  };

  describe('Default State', () => {
    it('debe renderizar el título del modal correctamente', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('¡Fin de partida!')).toBeInTheDocument();
    });

    it('debe mostrar el botón para volver al menú principal', () => {
      render(<GameOverModal {...defaultProps} />);

      const returnButton = screen.getByRole('button', { name: /volver al menú principal/i });
      expect(returnButton).toBeInTheDocument();
    });

    it('debe tener las clases CSS correctas para el overlay y modal', () => {
      const { container } = render(<GameOverModal {...defaultProps} />);
      
      const overlay = container.firstChild;
      expect(overlay.className).toContain('overlay');
      
      const modal = overlay.firstChild;
      expect(modal.className).toContain('modal');
    });
  });

  describe('Winner Messages', () => {
    it('debe mostrar mensaje correcto cuando un jugador gana (no asesino)', () => {
      render(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('¡Ganan los detectives!')).toBeInTheDocument();
    });

    it('debe mostrar mensaje correcto cuando múltiples jugadores ganan (no asesino)', () => {
      const props = {
        ...defaultProps,
        winners: ['Jugador1', 'Jugador2'],
      };
      render(<GameOverModal {...props} />);

      expect(screen.getByText('¡Ganan los detectives!')).toBeInTheDocument();
    });

    it('debe mostrar mensaje correcto cuando el asesino gana solo', () => {
      const props = {
        ...defaultProps,
        winners: ['Asesino'],
        asesinoGano: true,
      };
      render(<GameOverModal {...props} />);

      expect(screen.getByText('¡El asesino Asesino ganó la partida!')).toBeInTheDocument();
    });

    it('debe mostrar mensaje correcto cuando el asesino y cómplice ganan', () => {
      const props = {
        ...defaultProps,
        winners: ['Asesino', 'Cómplice'],
        asesinoGano: true,
      };
      render(<GameOverModal {...props} />);

      expect(screen.getByText('¡El asesino y su cómplice (Asesino, Cómplice) ganaron la partida!')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('debe llamar onReturnToMenu cuando se hace clic en el botón', () => {
      render(<GameOverModal {...defaultProps} />);

      const returnButton = screen.getByRole('button', { name: /volver al menú principal/i });
      fireEvent.click(returnButton);

      expect(mockOnReturnToMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dynamic Winner Resolution', () => {
    const mockPlayers = [
      { id_jugador: 1, nombre_jugador: 'Jugador1' },
      { id_jugador: 2, nombre_jugador: 'Jugador2' },
    ];

    const mockRoles = {
      murdererId: 1,
      accompliceId: 2,
    };

    it('debe resolver ganadores a partir de roles y jugadores cuando winners está vacío', async () => {
      const props = {
        ...defaultProps,
        winners: [],
        players: mockPlayers,
        roles: mockRoles,
        asesinoGano: true,
      };

      render(<GameOverModal {...props} />);

      await waitFor(() => {
        expect(screen.getByText(/Jugador1, Jugador2/)).toBeInTheDocument();
      });
    });

    it('debe hacer llamada a API cuando no hay roles y se proporciona gameId', async () => {
      const mockApiResponse = {
        'asesino-id': 1,
        'complice-id': 2,
      };

      apiService.getRoles.mockResolvedValue(mockApiResponse);

      const props = {
        ...defaultProps,
        winners: [],
        players: mockPlayers,
        roles: { murdererId: null, accompliceId: null },
        setRoles: mockSetRoles,
        gameId: 'game123',
        asesinoGano: true,
      };

      render(<GameOverModal {...props} />);

      await waitFor(() => {
        expect(apiService.getRoles).toHaveBeenCalledWith('game123');
      });

      await waitFor(() => {
        expect(mockSetRoles).toHaveBeenCalledWith({
          murdererId: 1,
          accompliceId: 2,
        });
      });
    });

    it('debe manejar errores de API gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      apiService.getRoles.mockRejectedValue(new Error('API Error'));

      const props = {
        ...defaultProps,
        winners: [],
        players: mockPlayers,
        roles: { murdererId: null, accompliceId: null },
        gameId: 'game123',
      };

      render(<GameOverModal {...props} />);

      await waitFor(() => {
        expect(apiService.getRoles).toHaveBeenCalledWith('game123');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'No se pudieron obtener roles al finalizar partida:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});