import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, expect } from 'vitest';
import GamePage from './GamePage';

vi.mock('@/services/websocketService', () => {
  const on = vi.fn();
  const off = vi.fn();
  return { default: { on, off } };
});

import websocketService from '@/services/websocketService';

describe('GamePage - fin-partida', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('registra callback de fin-partida y lo ejecuta', () => {
    let callback;
    websocketService.on.mockImplementation((event, cb) => {
      if (event === 'fin-partida') callback = cb;
    });

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    // Verificamos que se haya registrado el callback
    expect(websocketService.on).toHaveBeenCalledWith('fin-partida', expect.any(Function));

    const message = { payload: { ganadores: ['Alice', 'Bob'], asesinoGano: true } };
    callback(message);
    expect(callback).toBeDefined();
  });

  test('cleanup llama a websocketService.off', () => {
    const { unmount } = render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    unmount();
    expect(websocketService.off).toHaveBeenCalledWith('fin-partida', expect.any(Function));
  });
});
