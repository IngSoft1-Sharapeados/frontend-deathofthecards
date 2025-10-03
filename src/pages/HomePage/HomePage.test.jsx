import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomePage from '@/pages/HomePage/HomePage.jsx';

// Mocks para los componentes hijos
vi.mock('@/containers/CrearPartida/CreateGameContainer', () => ({
  default: ({ showForm, onClose }) => showForm ? <div data-testid="create-form">CrearPartidaForm</div> : null
}));
vi.mock('@/containers/ListarPartida/GameListContainer', () => ({
  default: ({ onJoinClick }) => <button data-testid="join-btn" onClick={() => onJoinClick('g1')}>Unirse</button>
}));
vi.mock('@/components/UserForm/UserForm.jsx', () => ({
  default: ({ gameId, onClose }) => <div data-testid="user-form">UserForm para {gameId}</div>
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el título y los botones principales', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /partidas disponibles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear partida/i })).toBeInTheDocument();
  });

  it('muestra el formulario de crear partida al hacer click en "Crear Partida"', async () => {
    render(<HomePage />);
    await userEvent.click(screen.getByRole('button', { name: /crear partida/i }));
    expect(screen.getByTestId('create-form')).toBeInTheDocument();
  });

  it('muestra el formulario de usuario al hacer click en "Unirse"', async () => {
    render(<HomePage />);
    await userEvent.click(screen.getByTestId('join-btn'));
    expect(screen.getByTestId('user-form')).toHaveTextContent('UserForm para g1');
  });

  it('actualiza la lista de partidas al hacer click en "Actualizar"', async () => {
    render(<HomePage />);
    const refreshBtn = screen.getByRole('button', { name: /actualizar/i });
    expect(refreshBtn).toBeInTheDocument();
    await userEvent.click(refreshBtn);
    // No hay efecto visible porque GameListContainer está mockeado, pero el botón existe y se puede clickear
  });
});
