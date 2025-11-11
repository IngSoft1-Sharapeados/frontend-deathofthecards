import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import React from 'react';
import GamePage from '@/pages/GamePage/GamePage';
import websocketService from '@/services/websocketService';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';

vi.mock('@/services/websocketService', () => {
  const handlers = {};
  return {
    default: {
      on: vi.fn((event, cb) => { handlers[event] = cb }),
      off: vi.fn((event) => { delete handlers[event] }),
      emitMock: (event, payload) => handlers[event]?.(payload)
    }
  };
});

vi.mock('@/services/apiService', () => ({
  apiService: {
    getPlayedSets: vi.fn(),
    getDeckCount: vi.fn(),
    getDiscardPile: vi.fn(),
    getMySecrets: vi.fn(() => Promise.resolve([])),
    getPlayerSecrets: vi.fn(() => Promise.resolve([])),
    requestTargetToRevealSecret: vi.fn(),
    votePointYourSuspicions: vi.fn(),
  }
}));

vi.mock('@/services/cardService', () => ({
  cardService: {
    getCardImageUrl: vi.fn(() => 'mock-url'),
    getSecretCards: vi.fn(() => [{ url: 'mock-secret.png' }]),
    getPlayingHand: vi.fn((data) => data || []),
    getDraftCards: vi.fn((data) => data || []),
  }
}));

// --- Helper para renderizar con ruta /game/:id --- //
function renderGamePage() {
  return render(
    <MemoryRouter initialEntries={['/game/99']}>
      <Routes>
        <Route path="/game/:id" element={<GamePage />} />
      </Routes>
    </MemoryRouter>
  );
}

// --- Tests --- //
describe('WebSocket "devius-card" → efectos de Social Faux Pas y Blackmailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('playerId', '1');
  });

  it('abre el SecretsModal al recibir Social Faux Pas si el jugador es objetivo', async () => {
    renderGamePage();

    // Simulamos que el hook montó el WS
    const message = {
      data: {
        tipo: 27, // Social Faux Pas
        jugador_emisor: 2,
        jugador_objetivo: 1
      }
    };

    // Emitir evento desde el mock de websocketService
    websocketService.emitMock('devius-card', message);

    // Esperar a que se abra el modal de secretos
    await waitFor(() => {
    expect(
      screen.getByRole('heading', { name: /Secretos de/i })
    ).toBeInTheDocument();
  });
  });

  it('abre el SecretsModal al recibir Blackmailed si el jugador es objetivo', async () => {
    renderGamePage();

    const message = {
      data: {
        tipo: 26, // Blackmailed
        jugador_emisor: 3,
        jugador_objetivo: 1
      }
    };

    websocketService.emitMock('devius-card', message);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Secretos de/i })
      ).toBeInTheDocument();
    });
  });
});
