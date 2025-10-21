import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import websocketService from '@/services/websocketService.js';

// Mock global WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    MockWebSocket.instances.push(this);
  }
  static instances = [];
  send(data) {}
  close() {
    if (this.onclose) this.onclose();
  }
}
global.WebSocket = MockWebSocket;

const gameId = 'test-game';
const playerId = 'test-player';

beforeEach(() => {
  MockWebSocket.instances = [];
});
afterEach(() => {
  websocketService.disconnect();
});

describe('websocketService', () => {
  it('connects and sets up WebSocket', () => {
    websocketService.connect(gameId, playerId);
    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain(gameId);
    expect(MockWebSocket.instances[0].url).toContain(playerId);
  });

  it('calls onopen when WebSocket opens', () => {
    websocketService.connect(gameId, playerId);
    const ws = MockWebSocket.instances[0];
    const spy = vi.spyOn(console, 'log');
    ws.onopen();
    expect(spy).toHaveBeenCalledWith('WebSocket conectado exitosamente.');
    spy.mockRestore();
  });

  it('calls registered event handler on message', () => {
    websocketService.connect(gameId, playerId);
    const ws = MockWebSocket.instances[0];
    const callback = vi.fn();
    websocketService.on('union-jugador', callback);
    const message = { evento: 'union-jugador', data: 'test' };
    const spy = vi.spyOn(console, 'log');
    ws.onmessage({ data: JSON.stringify(message) });
    expect(callback).toHaveBeenCalledWith(message);
    spy.mockRestore();
  });

  it('removes event handler with off', () => {
    websocketService.connect(gameId, playerId);
    const callback = vi.fn();
    websocketService.on('union-jugador', callback);
    websocketService.off('union-jugador', callback);
    const ws = MockWebSocket.instances[0];
    ws.onmessage({ data: JSON.stringify({ evento: 'union-jugador', data: 'test' }) });
    expect(callback).not.toHaveBeenCalled();
  });

  it('disconnect closes the WebSocket', () => {
    websocketService.connect(gameId, playerId);
    const ws = MockWebSocket.instances[0];
    const spy = vi.spyOn(console, 'log');
    websocketService.disconnect();
    expect(spy).toHaveBeenCalledWith('WebSocket desconectado.');
    spy.mockRestore();
  });

  it('handles invalid JSON in onmessage', () => {
    websocketService.connect(gameId, playerId);
    const ws = MockWebSocket.instances[0];
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    ws.onmessage({ data: 'not-json' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('handles WebSocket error', () => {
    websocketService.connect(gameId, playerId);
    const ws = MockWebSocket.instances[0];
    const spy = vi.spyOn(console, 'error');
    ws.onerror('error');
    expect(spy).toHaveBeenCalledWith('Error de WebSocket:', 'error');
    spy.mockRestore();
  });
});
