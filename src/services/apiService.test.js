import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '@/services/apiService.js';

// Mock global fetch
beforeEach(() => {
  vi.restoreAllMocks();
});

describe('apiService', () => {
  describe('Game Management', () => {
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

    it('startGame convierte gameId a entero', async () => {
      const mockResponse = { started: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      await apiService.startGame('123', 2);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/partidas/123'), expect.anything());
    });
  });

  describe('Card Operations', () => {
    it('discardCards hace PUT con cartas', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.discardCards(1, 2, [10, 11, 12]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/descarte/?id_jugador=2'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getHand obtiene mano del jugador', async () => {
      const mockResponse = { cartas: [1, 2, 3] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getHand(1, 2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/mano/?id_jugador=2'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('drawCards roba cartas correctamente', async () => {
      const mockResponse = { cartas: [5, 6] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.drawCards(1, 2, 2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/robar?id_jugador=2&cantidad=2'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('drawCards usa cantidad por defecto de 1', async () => {
      const mockResponse = { cartas: [5] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      await apiService.drawCards(1, 2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('cantidad=1'),
        expect.anything()
      );
    });
  });

  describe('Game State', () => {
    it('getTurn obtiene turno actual', async () => {
      const mockResponse = { turno: 1 };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getTurn(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/turno'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getDeckCount obtiene cantidad de cartas en mazo', async () => {
      const mockResponse = { cantidad: 42 };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getDeckCount(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/mazo'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getTurnOrder obtiene orden de turnos', async () => {
      const mockResponse = { orden: [1, 2, 3] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getTurnOrder(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/turnos'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getRoles obtiene roles de la partida', async () => {
      const mockResponse = { asesino: 1, complice: 2 };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getRoles(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/roles'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Secrets Operations', () => {
    it('getMySecrets obtiene secretos propios', async () => {
      const mockResponse = { secretos: [3, 4] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getMySecrets(1, 2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/secretos?id_jugador=2'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getPlayerSecrets obtiene secretos de un jugador', async () => {
      const mockResponse = { secretos: [3, 4] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getPlayerSecrets(1, 2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/secretosjugador?id_jugador=2'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('revealSecret revela un secreto', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.revealSecret(1, 2, 'secret123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/revelacion?id_jugador_turno=2&id_unico_secreto=secret123'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('hideSecret oculta un secreto', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.hideSecret(1, 2, 'secret123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/ocultamiento?id_jugador_turno=2&id_unico_secreto=secret123'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('revealOwnSecret revela secreto propio', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.revealOwnSecret(1, 2, 'secret123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/revelacion-propia?id_jugador=2&id_unico_secreto=secret123'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('robSecret roba un secreto', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.robSecret(1, 2, 3, 'secret123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/robo-secreto?id_jugador_turno=2&id_jugador_destino=3&id_unico_secreto=secret123'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('requestTargetToRevealSecret solicita revelación con motivo por defecto', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      await apiService.requestTargetToRevealSecret(1, 2, 3);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('motivo=lady-brent'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('requestTargetToRevealSecret permite motivo personalizado', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      await apiService.requestTargetToRevealSecret(1, 2, 3, 'custom-reason');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('motivo=custom-reason'),
        expect.anything()
      );
    });
  });

  describe('Draft and Sets', () => {
    it('getDraftCards obtiene cartas de draft', async () => {
      const mockResponse = { draft: [1, 2, 3] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getDraftCards(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/draft'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('takeDraftCard toma cartas del draft', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.takeDraftCard(1, 2, [10, 11]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/draft?id_jugador=2'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('pickUpCards recoge cartas del draft', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.pickUpCards(1, 2, [10, 11]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/jugador/2/recoger'),
        expect.objectContaining({ 
          method: 'PUT',
          body: JSON.stringify({ cartas_draft: [10, 11] })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('playDetectiveSet juega un set de detectives', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.playDetectiveSet(1, 2, [7, 8, 9]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/Jugar-set?id_jugador=2'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getPlayedSets obtiene sets jugados', async () => {
      const mockResponse = { sets: [] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getPlayedSets(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/sets'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Discard Pile', () => {
    it('getDiscardPile obtiene pila de descarte con cantidad por defecto', async () => {
      const mockResponse = { descarte: [20, 21] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.getDiscardPile(1, 2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/descarte?id_jugador=2&cantidad=1'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('getDiscardPile obtiene cantidad específica de cartas', async () => {
      const mockResponse = { descarte: [20, 21, 22] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      await apiService.getDiscardPile(1, 2, 5);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('cantidad=5'),
        expect.anything()
      );
    });
  });

  describe('Event Cards', () => {
    it('playCardsOffTheTable juega carta evento', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const result = await apiService.playCardsOffTheTable(1, 2, 3, 17);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/evento/CardsTable?id_jugador=2&id_objetivo=3&id_carta=17'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('playAnotherVictim juega carta Another Victim', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const targetSet = {
        jugador_id: 3,
        representacion_id_carta: 1,
        cartas_ids: [7, 8, 9]
      };
      const result = await apiService.playAnotherVictim(1, 2, 18, targetSet);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/evento/AnotherVictim?id_jugador=2&id_carta=18'),
        expect.objectContaining({ 
          method: 'PUT',
          body: JSON.stringify({
            id_objetivo: targetSet.jugador_id,
            id_representacion_carta: targetSet.representacion_id_carta,
            ids_cartas: targetSet.cartas_ids
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('playOneMore juega carta One More', async () => {
      const mockResponse = { success: true };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));
      const payload = {
        id_fuente: 2,
        id_destino: 3,
        id_unico_secreto: 'secret123'
      };
      const result = await apiService.playOneMore(1, 2, 22, payload);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/partidas/1/evento/OneMore?id_jugador=2&id_carta=22'),
        expect.objectContaining({ 
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('lanza error si response no es ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: 'Error personalizado' })
      }));
      await expect(apiService.createGame({})).rejects.toThrow('Error personalizado');
    });
  });
});
