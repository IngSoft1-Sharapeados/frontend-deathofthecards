import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { apiService } from '@/services/apiService';
import styles from './Chat.module.css';

const Chat = ({ gameId, playerId, playerName, websocketService }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    const handleNewMessage = (message) => {
      // Evitar duplicados comparando con el último mensaje
      const messageKey = `${message.nombre}-${message.texto}`;
      if (lastMessageRef.current === messageKey) {
        return;
      }
      lastMessageRef.current = messageKey;
      
      setMessages(prev => [...prev, { nombre: message.nombre, texto: message.texto }]);
      
      // Limpiar la referencia después de un tiempo
      setTimeout(() => {
        lastMessageRef.current = null;
      }, 1000);
    };

    websocketService.on('nuevo-mensaje', handleNewMessage);
    return () => websocketService.off('nuevo-mensaje', handleNewMessage);
  }, [websocketService]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      await apiService.sendChatMessage(gameId, playerId, {
        nombreJugador: playerName,
        texto: inputValue
      });
      setInputValue('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        💬 Chat
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>No hay mensajes</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={styles.message}>
              <span className={styles.messageName}>{msg.nombre}:</span> {msg.texto}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje..."
          className={styles.input}
          maxLength={200}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          className={styles.sendButton}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

Chat.propTypes = {
  gameId: PropTypes.string.isRequired,
  playerId: PropTypes.number.isRequired,
  playerName: PropTypes.string.isRequired,
  websocketService: PropTypes.object.isRequired
};

export default Chat;
