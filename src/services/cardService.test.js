import { describe, it, expect, vi } from 'vitest';
import { cardService } from '@/services/cardService.js';

describe('cardService', () => {
  describe('getRandomCards', () => {
    it('devuelve cantidad correcta de cartas', () => {
      const cards = cardService.getRandomCards(6);
      expect(cards).toHaveLength(6);
    });

    it('devuelve cartas con estructura correcta', () => {
      const cards = cardService.getRandomCards(3);
      cards.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('url');
        expect(typeof card.id).toBe('number');
        expect(typeof card.url).toBe('string');
      });
    });

    it('devuelve array vacío cuando se solicitan 0 cartas', () => {
      const cards = cardService.getRandomCards(0);
      expect(cards).toHaveLength(0);
    });

    it('no devuelve más cartas de las disponibles', () => {
      const cards = cardService.getRandomCards(100);
      expect(cards.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getPlayingHand', () => {
    it('mapea IDs de cartas a assets correctamente', () => {
      const handData = [
        { id: 7 },
        { id: 8 },
        { id: 9 }
      ];
      const result = cardService.getPlayingHand(handData);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 7, url: '07-detective_poirot.png' });
      expect(result[1]).toEqual({ id: 8, url: '08-detective_marple.png' });
      expect(result[2]).toEqual({ id: 9, url: '09-detective_satterthwaite.png' });
    });

    it('usa fallback para IDs desconocidos', () => {
      const handData = [
        { id: 7 },
        { id: 999 }, // ID no existente
        { id: 10 }
      ];
      const result = cardService.getPlayingHand(handData);
      
      expect(result).toHaveLength(3);
      expect(result[0].url).toBe('07-detective_poirot.png');
      expect(result[1]).toEqual({ id: 999, url: '01-card_back.png' });
      expect(result[2].url).toBe('10-detective_pyne.png');
    });

    it('maneja array vacío', () => {
      const result = cardService.getPlayingHand([]);
      expect(result).toHaveLength(0);
    });

    it('mapea cartas de evento correctamente', () => {
      const handData = [
        { id: 17 },
        { id: 18 },
        { id: 19 }
      ];
      const result = cardService.getPlayingHand(handData);
      
      expect(result[0].url).toBe('17-event_cardsonthetable.png');
      expect(result[1].url).toBe('18-event_anothervictim.png');
      expect(result[2].url).toBe('19-event_deadcardfolly.png');
    });

    it('mapea cartas instantáneas correctamente', () => {
      const handData = [{ id: 16 }];
      const result = cardService.getPlayingHand(handData);
      
      expect(result[0].url).toBe('16-Instant_notsofast.png');
    });

    it('mapea cartas devious correctamente', () => {
      const handData = [
        { id: 26 },
        { id: 27 }
      ];
      const result = cardService.getPlayingHand(handData);
      
      expect(result[0].url).toBe('26-devious_blackmailed.png');
      expect(result[1].url).toBe('27-devious_fauxpas.png');
    });
  });

  describe('getSecretCards', () => {
    it('mapea secretos correctamente', () => {
      const secretData = [
        { id: 3 },
        { id: 4 },
        { id: 6 }
      ];
      const result = cardService.getSecretCards(secretData);
      
      expect(result).toHaveLength(3);
      expect(result[0].url).toBe('03-secret_murderer.png');
      expect(result[1].url).toBe('04-secret_accomplice.png');
      expect(result[2].url).toBe('06-secret_front.png');
    });

    it('usa fallback para secretos desconocidos', () => {
      const secretData = [
        { id: 3 },
        { id: 999 }
      ];
      const result = cardService.getSecretCards(secretData);
      
      expect(result[0].url).toBe('03-secret_murderer.png');
      expect(result[1]).toEqual({ id: 999, url: '05-secret_back.png' });
    });

    it('maneja array vacío', () => {
      const result = cardService.getSecretCards([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getRandomDetectives', () => {
    it('devuelve cantidad correcta de detectives', () => {
      const detectives = cardService.getRandomDetectives(3);
      expect(detectives).toHaveLength(3);
    });

    it('devuelve solo cartas de detectives', () => {
      const detectives = cardService.getRandomDetectives(5);
      detectives.forEach(card => {
        expect(card.id).toBeGreaterThanOrEqual(7);
        expect(card.id).toBeLessThanOrEqual(15);
        expect(card.url).toContain('detective');
      });
    });

    it('maneja solicitud de 0 detectives', () => {
      const detectives = cardService.getRandomDetectives(0);
      expect(detectives).toHaveLength(0);
    });

    it('no devuelve más de 9 detectives (total disponible)', () => {
      const detectives = cardService.getRandomDetectives(20);
      expect(detectives.length).toBeLessThanOrEqual(9);
    });
  });

  describe('getDraftCards', () => {
    it('mapea cartas de draft correctamente', () => {
      const draftData = [
        { id: 7 },
        { id: 16 },
        { id: 20 }
      ];
      const result = cardService.getDraftCards(draftData);
      
      expect(result).toHaveLength(3);
      expect(result[0].url).toBe('07-detective_poirot.png');
      expect(result[1].url).toBe('16-Instant_notsofast.png');
      expect(result[2].url).toBe('20-event_lookashes.png');
    });

    it('usa fallback para IDs no encontrados', () => {
      const draftData = [
        { id: 7 },
        { id: 888 }
      ];
      const result = cardService.getDraftCards(draftData);
      
      expect(result[0].url).toBe('07-detective_poirot.png');
      expect(result[1]).toEqual({ id: 888, url: '01-card_back.png' });
    });

    it('maneja array vacío', () => {
      const result = cardService.getDraftCards([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getEventCardData', () => {
    it('encuentra carta de evento por ID', () => {
      const card = cardService.getEventCardData(17);
      expect(card).toEqual({ id: 17, url: '17-event_cardsonthetable.png' });
    });

    it('encuentra otra carta de evento', () => {
      const card = cardService.getEventCardData(22);
      expect(card).toEqual({ id: 22, url: '22-event_onemore.png' });
    });

    it('devuelve undefined para ID no existente', () => {
      const card = cardService.getEventCardData(999);
      expect(card).toBeUndefined();
    });

    it('devuelve undefined para ID de carta que no es evento', () => {
      const card = cardService.getEventCardData(7); // Detective card
      expect(card).toBeUndefined();
    });

    it('maneja ID como string y lo convierte', () => {
      const card = cardService.getEventCardData('18');
      expect(card).toEqual({ id: 18, url: '18-event_anothervictim.png' });
    });

    it('encuentra todas las cartas de evento', () => {
      const eventIds = [17, 18, 19, 20, 21, 22, 23, 24, 25];
      eventIds.forEach(id => {
        const card = cardService.getEventCardData(id);
        expect(card).toBeDefined();
        expect(card.id).toBe(id);
        expect(card.url).toContain('event');
      });
    });
  });

  describe('getCardImageUrl', () => {
    it('devuelve URL para carta de detective', () => {
      const url = cardService.getCardImageUrl(7);
      expect(url).toBe('07-detective_poirot.png');
    });

    it('devuelve URL para carta de evento', () => {
      const url = cardService.getCardImageUrl(20);
      expect(url).toBe('20-event_lookashes.png');
    });

    it('devuelve URL para carta instantánea', () => {
      const url = cardService.getCardImageUrl(16);
      expect(url).toBe('16-Instant_notsofast.png');
    });

    it('devuelve URL para carta devious', () => {
      const url = cardService.getCardImageUrl(26);
      expect(url).toBe('26-devious_blackmailed.png');
    });

    it('devuelve fallback para ID no existente', () => {
      const url = cardService.getCardImageUrl(999);
      expect(url).toBe('01-card_back.png');
    });

    it('devuelve fallback para undefined', () => {
      const url = cardService.getCardImageUrl(undefined);
      expect(url).toBe('01-card_back.png');
    });

    it('devuelve fallback para null', () => {
      const url = cardService.getCardImageUrl(null);
      expect(url).toBe('01-card_back.png');
    });

    it('devuelve URLs correctas para múltiples IDs', () => {
      const ids = [7, 16, 17, 26];
      const urls = ids.map(id => cardService.getCardImageUrl(id));
      
      expect(urls[0]).toBe('07-detective_poirot.png');
      expect(urls[1]).toBe('16-Instant_notsofast.png');
      expect(urls[2]).toBe('17-event_cardsonthetable.png');
      expect(urls[3]).toBe('26-devious_blackmailed.png');
    });
  });

  describe('Edge cases and integration', () => {
    it('maneja mezcla de cartas válidas e inválidas en getPlayingHand', () => {
      const handData = [
        { id: 7 },
        { id: 999 },
        { id: 17 },
        { id: -1 },
        { id: 26 }
      ];
      const result = cardService.getPlayingHand(handData);
      
      expect(result).toHaveLength(5);
      expect(result[0].url).toBe('07-detective_poirot.png');
      expect(result[1].url).toBe('01-card_back.png');
      expect(result[2].url).toBe('17-event_cardsonthetable.png');
      expect(result[3].url).toBe('01-card_back.png');
      expect(result[4].url).toBe('26-devious_blackmailed.png');
    });

    it('preserva IDs originales en todos los métodos', () => {
      const testId = 999;
      const handResult = cardService.getPlayingHand([{ id: testId }]);
      const draftResult = cardService.getDraftCards([{ id: testId }]);
      const secretResult = cardService.getSecretCards([{ id: testId }]);
      
      expect(handResult[0].id).toBe(testId);
      expect(draftResult[0].id).toBe(testId);
      expect(secretResult[0].id).toBe(testId);
    });

    it('getRandomCards devuelve cartas diferentes en diferentes llamadas (probabilístico)', () => {
      const cards1 = cardService.getRandomCards(5);
      const cards2 = cardService.getRandomCards(5);
      
      // Aunque es posible que sean iguales, es muy improbable
      const areIdentical = JSON.stringify(cards1) === JSON.stringify(cards2);
      expect(areIdentical).toBe(false);
    });

    it('getRandomDetectives devuelve detectives diferentes en diferentes llamadas', () => {
      const det1 = cardService.getRandomDetectives(5);
      const det2 = cardService.getRandomDetectives(5);
      
      const areIdentical = JSON.stringify(det1) === JSON.stringify(det2);
      expect(areIdentical).toBe(false);
    });
  });
});
