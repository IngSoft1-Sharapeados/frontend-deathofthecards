import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chat from './Chat';
import { apiService } from '@/services/apiService';

vi.mock('@/services/apiService', () => ({
  apiService: {
    sendChatMessage: vi.fn()
  }
}));

describe('Chat Component', () => {
  const mockWebsocketService = {
    on: vi.fn(),
    off: vi.fn()
  };

  const defaultProps = {
    gameId: '1',
    playerId: 123,
    playerName: 'TestPlayer',
    websocketService: mockWebsocketService
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat component', () => {
    render(<Chat {...defaultProps} />);
    expect(screen.getByText('💬 Chat')).toBeDefined();
    expect(screen.getByPlaceholderText('Mensaje...')).toBeDefined();
  });

  it('subscribes to nuevo-mensaje event on mount', () => {
    render(<Chat {...defaultProps} />);
    expect(mockWebsocketService.on).toHaveBeenCalledWith('nuevo-mensaje', expect.any(Function));
  });

  it('unsubscribes from nuevo-mensaje event on unmount', () => {
    const { unmount } = render(<Chat {...defaultProps} />);
    unmount();
    expect(mockWebsocketService.off).toHaveBeenCalledWith('nuevo-mensaje', expect.any(Function));
  });

  it('displays received messages', async () => {
    render(<Chat {...defaultProps} />);
    
    const messageHandler = mockWebsocketService.on.mock.calls[0][1];
    messageHandler({ nombre: 'Player1', texto: 'Hello!' });
    
    await waitFor(() => {
      expect(screen.getByText(/Player1:/)).toBeDefined();
      expect(screen.getByText(/Hello!/)).toBeDefined();
    });
  });

  it('sends message when send button is clicked', async () => {
    apiService.sendChatMessage.mockResolvedValue({});

    render(<Chat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Mensaje...');
    const sendButton = screen.getByText('➤');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(apiService.sendChatMessage).toHaveBeenCalledWith(
        '1',
        123,
        {
          nombreJugador: 'TestPlayer',
          texto: 'Test message'
        }
      );
    });
  });

  it('disables send button when input is empty', () => {
    render(<Chat {...defaultProps} />);

    const sendButton = screen.getByText('➤');
    expect(sendButton.disabled).toBe(true);
  });

  it('clears input after sending message', async () => {
    apiService.sendChatMessage.mockResolvedValue({});

    render(<Chat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Mensaje...');
    const sendButton = screen.getByText('➤');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('prevents duplicate messages', async () => {
    render(<Chat {...defaultProps} />);
    
    const messageHandler = mockWebsocketService.on.mock.calls[0][1];
    
    // Enviar el mismo mensaje dos veces rápidamente
    messageHandler({ nombre: 'Player1', texto: 'Duplicate' });
    messageHandler({ nombre: 'Player1', texto: 'Duplicate' });
    
    // Esperar a que se procesen los mensajes
    await waitFor(() => {
      const messages = screen.queryAllByText(/Duplicate/);
      expect(messages.length).toBe(1);
    });
  });
});
