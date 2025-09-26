import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import PlayerList from '@/components/PlayerList/PlayerList.jsx';

expect.extend(matchers);

describe('PlayerList', () => {
  const mockPlayers = [
    { id_jugador: 1, nombre_jugador: 'Andrés' },
    { id_jugador: 2, nombre_jugador: 'Fran' },
    { id_jugador: 3, nombre_jugador: 'Santi' },
  ];

  describe('Data Rendering', () => {
    it('debe renderizar una lista de jugadores si se proporcionan', () => {
      render(<PlayerList players={mockPlayers} />);
      expect(screen.getByText('Andrés')).toBeInTheDocument();
      expect(screen.getByText('Fran')).toBeInTheDocument();
      expect(screen.getByText('Santi')).toBeInTheDocument();
      expect(screen.queryByText('Esperando jugadores...')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('debe mostrar un mensaje de espera si no hay jugadores', () => {
      render(<PlayerList players={[]} />);
      expect(screen.getByText('Esperando jugadores...')).toBeInTheDocument();
      expect(screen.queryByText('Andrés')).not.toBeInTheDocument();
    });
  });
});