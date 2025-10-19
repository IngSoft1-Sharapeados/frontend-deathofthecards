import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerSelectModal from '@/components/UI/PlayerSelectModal/PlayerSelectModal.jsx';

describe('PlayerSelectModal', () => {
  beforeEach(() => vi.clearAllMocks());

  const players = [
    { id_jugador: 1, nombre_jugador: 'Alice' },
    { id_jugador: 2, nombre_jugador: 'Bob' },
  ];

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <PlayerSelectModal isOpen={false} onClose={vi.fn()} players={players} onSelect={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título y lista cuando isOpen es true', () => {
    render(
      <PlayerSelectModal
        isOpen={true}
        onClose={vi.fn()}
        players={players}
        title="Selecciona un jugador"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Selecciona un jugador')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('propaga onSelect cuando se hace click en seleccionar', () => {
    const onSelect = vi.fn();
    render(
      <PlayerSelectModal isOpen={true} onClose={vi.fn()} players={players} onSelect={onSelect} />
    );
    const buttons = screen.getAllByText('Seleccionar');
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith(players[0]);
  });

  it('llama onClose al hacer click en Cancelar', () => {
    const onClose = vi.fn();
    render(
      <PlayerSelectModal isOpen={true} onClose={onClose} players={players} onSelect={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
});
