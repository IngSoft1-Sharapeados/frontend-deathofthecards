import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import GameCard from './GameCard';

// Línea clave: Le decimos a Vitest que use los "matchers" de jest-dom
expect.extend(matchers);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GameCard', () => {
  const mockGame = {
    id: 'g1',
    name: 'Partida Test',
    minPlayers: 2,
    maxPlayers: 5,
    currentPlayers: 4,
  };

  describe('Default State', () => {
    it('debe renderizar la información de la partida correctamente', () => {
      render(<GameCard game={mockGame} />);

      expect(screen.getByText('Partida Test')).toBeInTheDocument();
      expect(screen.getByText('Jugadores: 4')).toBeInTheDocument();
      expect(screen.getByText('Límite: 2 - 5')).toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    it('debe mostrar un botón para unirse a la partida', () => {
      render(<GameCard game={mockGame} />);
      const joinButton = screen.getByRole('button', { name: /unirse/i });
      expect(joinButton).toBeInTheDocument();
    });

    it('debe tener las clases CSS correctas para el estilo', () => {
      const { container } = render(<GameCard game={mockGame} />);
      const cardElement = container.firstChild;
      expect(cardElement.className).toContain('card');
    });
  });
});