import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GameLobbyPage from '@/pages/gameLobby/gameLobby.jsx';

// Hoisted mock state for apiService
const apiMockState = vi.hoisted(() => ({
  getGameDetails: vi.fn(),
  abandonGame: vi.fn(),
  startGame: vi.fn(),
}));
vi.mock('@/services/apiService', () => ({
  apiService: {
    getGameDetails: (...args) => apiMockState.getGameDetails(...args),
    abandonGame: (...args) => apiMockState.abandonGame(...args),
    startGame: (...args) => apiMockState.startGame(...args),
  }
}));

// Hoisted mock state for websocketService
const wsMockState = vi.hoisted(() => ({
  handlers: {},
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn((evt, cb) => {
    wsMockState.handlers[evt] = wsMockState.handlers[evt] || [];
    wsMockState.handlers[evt].push(cb);
  }),
  off: vi.fn((evt, cb) => {
    wsMockState.handlers[evt] = (wsMockState.handlers[evt] || []).filter((fn) => fn !== cb);
  }),
}));
vi.mock('@/services/websocketService', () => ({
  default: {
    connect: (...args) => wsMockState.connect(...args),
    disconnect: (...args) => wsMockState.disconnect(...args),
    on: (...args) => wsMockState.on(...args),
    off: (...args) => wsMockState.off(...args),
  }
}));

// Mock useNavigate to assert navigation
const navMock = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    useNavigate: () => navMock.navigate,
  };
});

const renderWithRoute = (initialPath = '/partidas/123/lobby') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/partidas/:id/lobby" element={<GameLobbyPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('GameLobbyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wsMockState.handlers = {};
    // Default game details
    apiMockState.getGameDetails.mockResolvedValue({
      nombre_partida: 'Sala Test',
      id_anfitrion: 1,
      minJugadores: 2,
      listaJugadores: [
        { id_jugador: 1, nombre_jugador: 'Host' },
      ],
    });
    // Set playerId in sessionStorage
    window.sessionStorage.setItem('playerId', '1');
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('renderiza título y acciones de anfitrión', async () => {
    renderWithRoute();
    // Espera título
    expect(await screen.findByRole('heading', { name: /sala test/i })).toBeInTheDocument();
    // Botón iniciar presente y botón cancelar partida presente
    expect(screen.getByRole('button', { name: /iniciar partida/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar partida/i })).toBeInTheDocument();
  // Conecta a WS con gameId y playerId
  expect(wsMockState.connect).toHaveBeenCalledWith('123', '1');
  });

  it('muestra "Abandonar sala" para invitado y abandona al confirmar', async () => {
    // Invitado es id 2
    window.sessionStorage.setItem('playerId', '2');
    apiMockState.getGameDetails.mockResolvedValueOnce({
      nombre_partida: 'Sala Test',
      id_anfitrion: 1,
      minJugadores: 2,
      listaJugadores: [
        { id_jugador: 1, nombre_jugador: 'Host' },
        { id_jugador: 2, nombre_jugador: 'Invitado' },
      ],
    });

    // Confirmación de ventana
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithRoute();
    expect(await screen.findByText(/esperando que el anfitrión/i)).toBeInTheDocument();
    const abandonBtn = screen.getByRole('button', { name: /abandonar sala/i });
    await userEvent.click(abandonBtn);

  expect(apiMockState.abandonGame).toHaveBeenCalledWith('123', 2);
  expect(navMock.navigate).toHaveBeenCalledWith('/');
    confirmSpy.mockRestore();
  });

  it('muestra modal cuando el anfitrión cancela la partida', async () => {
    renderWithRoute();
    // Esperar a que se cargue la sala
    expect(await screen.findByRole('heading', { name: /sala test/i })).toBeInTheDocument();

    // Emitir evento de cancelación
    // Note: nuestro mock registra handlers en `handlers`
  (wsMockState.handlers['partida-cancelada'] || []).forEach((cb) => cb({ evento: 'partida-cancelada' }));

  expect(await screen.findByText(/la partida fue cancelada/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /volver al inicio/i }));
  expect(navMock.navigate).toHaveBeenCalledWith('/');
  });
});
