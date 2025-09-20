import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameList from './GameList';
import '@testing-library/jest-dom';

// Datos mock para las pruebas
const mockGames = [
  { id: 1, name: 'Partida 1', minPlayers: 2, maxPlayers: 4, currentPlayers: 2 },
  { id: 2, name: 'Sala de Espera', minPlayers: 3, maxPlayers: 6, currentPlayers: 5 },
];

const mockEmptyGames = [];

describe('GameList', () => {
  it('debe renderizar una lista de partidas si se proporcionan', () => {
    render(<GameList games={mockGames} />);

    // Verifica que ambas partidas se rendericen
    expect(screen.getByText('Partida 1')).toBeInTheDocument();
    expect(screen.getByText('Sala de Espera')).toBeInTheDocument();

    // Asegurarse de que el mensaje de "no hay partidas" no aparezca
    expect(screen.queryByText('No hay partidas disponibles')).not.toBeInTheDocument();
  });

  it('debe mostrar el mensaje "No hay partidas disponibles" si la lista está vacía', () => {
    render(<GameList games={mockEmptyGames} />);

    // Verifica que el mensaje de estado vacío se muestre
    expect(screen.getByText('No hay partidas disponibles')).toBeInTheDocument();
  });
});