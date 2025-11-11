import styles from './EventLogModal.module.css';

const EventLogModal = ({ isOpen, onClose, events }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Log de Eventos</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {events.length === 0 ? (
            <p className={styles.emptyMessage}>No hay eventos registrados aún</p>
          ) : (
            <ul className={styles.eventList}>
              {events.map((event) => (
                <li key={event.id} className={`${styles.eventItem} ${styles[event.type]}`}>
                  <span className={styles.timestamp}>{event.timestamp}</span>
                  <span className={styles.message}>{event.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLogModal;
