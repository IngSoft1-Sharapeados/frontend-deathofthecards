import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EventLogModal from './EventLogModal';

describe('EventLogModal', () => {
  const mockEvents = [
    {
      id: 1,
      type: 'turn-start',
      message: 'Jugador 1 comienza su turno',
      timestamp: '10:30:15',
      playerName: 'Jugador 1'
    },
    {
      id: 2,
      type: 'event-card',
      message: 'Jugador 2 jugó la carta de evento "Cards off the Table"',
      timestamp: '10:30:45',
      playerName: 'Jugador 2',
      cardName: 'Cards off the Table'
    },
    {
      id: 3,
      type: 'set-played',
      message: 'Jugador 1 jugó un Set de Detectives: Hercule Poirot',
      timestamp: '10:31:20',
      playerName: 'Jugador 1',
      setName: 'Hercule Poirot'
    }
  ];

  it('no debe renderizar cuando isOpen es false', () => {
    const { container } = render(
      <EventLogModal isOpen={false} onClose={vi.fn()} events={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar el modal cuando isOpen es true', () => {
    render(<EventLogModal isOpen={true} onClose={vi.fn()} events={[]} />);
    expect(screen.getByText('Log de Eventos')).toBeTruthy();
  });

  it('debe mostrar mensaje cuando no hay eventos', () => {
    render(<EventLogModal isOpen={true} onClose={vi.fn()} events={[]} />);
    expect(screen.getByText('No hay eventos registrados aún')).toBeTruthy();
  });

  it('debe mostrar todos los eventos', () => {
    render(<EventLogModal isOpen={true} onClose={vi.fn()} events={mockEvents} />);
    
    expect(screen.getByText('Jugador 1 comienza su turno')).toBeTruthy();
    expect(screen.getByText('Jugador 2 jugó la carta de evento "Cards off the Table"')).toBeTruthy();
    expect(screen.getByText('Jugador 1 jugó un Set de Detectives: Hercule Poirot')).toBeTruthy();
  });

  it('debe mostrar los timestamps de los eventos', () => {
    render(<EventLogModal isOpen={true} onClose={vi.fn()} events={mockEvents} />);
    
    expect(screen.getByText('10:30:15')).toBeTruthy();
    expect(screen.getByText('10:30:45')).toBeTruthy();
    expect(screen.getByText('10:31:20')).toBeTruthy();
  });

  it('debe llamar a onClose cuando se hace clic en el botón de cerrar', () => {
    const onCloseMock = vi.fn();
    render(<EventLogModal isOpen={true} onClose={onCloseMock} events={mockEvents} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('debe llamar a onClose cuando se hace clic en el overlay', () => {
    const onCloseMock = vi.fn();
    const { container } = render(
      <EventLogModal isOpen={true} onClose={onCloseMock} events={mockEvents} />
    );
    
    const overlay = container.querySelector('[class*="overlay"]');
    fireEvent.click(overlay);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('no debe llamar a onClose cuando se hace clic dentro del modal', () => {
    const onCloseMock = vi.fn();
    const { container } = render(
      <EventLogModal isOpen={true} onClose={onCloseMock} events={mockEvents} />
    );
    
    const modal = container.querySelector('[class*="modal"]');
    fireEvent.click(modal);
    
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
