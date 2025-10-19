import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerSelectTable from '@/components/UI/PlayerSelectTable/PlayerSelectTable.jsx';

describe('PlayerSelectTable', () => {
  beforeEach(() => vi.clearAllMocks());

  const players = [
    { id_jugador: 1, nombre_jugador: 'Alice' },
    { id_jugador: 2, nombre_jugador: 'Bob' },
  ];

  it('renderiza los jugadores y el botón seleccionar', () => {
    const onSelect = vi.fn();
    render(<PlayerSelectTable players={players} onSelect={onSelect} />);
    expect(screen.getByText('Jugador')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByText('Seleccionar')).toHaveLength(2);
  });

  it('llama onSelect con el jugador correcto', () => {
    const onSelect = vi.fn();
    render(<PlayerSelectTable players={players} onSelect={onSelect} />);
    const buttons = screen.getAllByText('Seleccionar');
    fireEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(players[1]);
  });
});
