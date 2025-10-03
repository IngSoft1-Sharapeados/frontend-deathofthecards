import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '@/services/apiService.js';

// Mock global fetch
beforeEach(() => {
  vi.restoreAllMocks();
});

describe('apiService', () => {
  it('createGame hace POST y retorna datos', async () => {
    const mockResponse = { id_partida: 1 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));
    const result = await apiService.createGame({ nombre: 'Test' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/partidas'), expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual(mockResponse);
  });

  it('listGames hace GET y retorna datos', async () => {
    const mockResponse = [{ id_partida: 1 }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));
    const result = await apiService.listGames();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/partidas'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(mockResponse);
  });

  it('joinGame hace POST y retorna datos', async () => {
    const mockResponse = { id_jugador: 2 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));
    const result = await apiService.joinGame(1, { nombre: 'Jugador' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/partidas/1'), expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual(mockResponse);
  });

  it('getGameDetails hace GET y retorna datos', async () => {
    const mockResponse = { id_partida: 1 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));
    const result = await apiService.getGameDetails(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/partidas/1'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(mockResponse);
  });

  it('startGame hace PUT y retorna datos', async () => {
    const mockResponse = { started: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));
    const result = await apiService.startGame(1, 2);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/partidas/1'), expect.objectContaining({ method: 'PUT' }));
    expect(result).toEqual(mockResponse);
  });

  it('lanza error si response no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Error personalizado' })
    }));
    await expect(apiService.createGame({})).rejects.toThrow('Error personalizado');
  });
});
