import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './GameOverModal.module.css';
import { apiService } from '@/services/apiService';

// Resuelve ganadores a partir de roles y lista de jugadores
const resolveWinners = (rolesObj, playersList) => {
  if (!rolesObj || !rolesObj.murdererId) return null;
  const murderer = playersList?.find(p => p.id_jugador === rolesObj.murdererId);
  const accomplice = rolesObj.accompliceId
    ? playersList?.find(p => p.id_jugador === rolesObj.accompliceId)
    : null;
  const names = [];
  if (murderer?.nombre_jugador) names.push(murderer.nombre_jugador);
  if (accomplice?.nombre_jugador) names.push(accomplice.nombre_jugador);
  // Devolvemos null si no encontramos nombres, para diferenciar de "nadie ganó"
  return names.length ? names : null; 
};

const GameOverModal = ({
  winners, // Lista de nombres del WebSocket (puede estar vacía)
  asesinoGano, // Booleano del WebSocket
  onReturnToMenu,
  players = [], // Lista completa de jugadores con IDs y nombres
  roles = { murdererId: null, accompliceId: null }, // Roles locales (pueden estar desactualizados)
  setRoles,
  gameId,
}) => {
  const [resolvedWinnerNames, setResolvedWinnerNames] = useState(null); // Estado para guardar nombres resueltos

  // Efecto para intentar resolver los nombres si no vienen del WebSocket
  useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      // Si el WebSocket ya nos dio nombres, usamos esos.
      if (Array.isArray(winners) && winners.length > 0) {
        if (!cancelled) setResolvedWinnerNames(winners);
        return;
      }
      
      // Si no hay nombres del WS Y el asesino ganó (o no sabemos), intentamos resolverlos.
      if (asesinoGano || !Array.isArray(winners) || winners.length === 0) {
        let names = resolveWinners(roles, players);
        
        // Si no pudimos resolver con roles locales, pedimos al backend
        if (!names && gameId) {
          try {
            const rolesData = await apiService.getRoles(gameId);
            const fetchedRoles = {
              murdererId: rolesData?.['asesino-id'] ?? null,
              accompliceId: rolesData?.['complice-id'] ?? null,
            };
            names = resolveWinners(fetchedRoles, players);
            if (typeof setRoles === 'function' && !roles?.murdererId && fetchedRoles.murdererId) {
              setRoles(fetchedRoles);
            }
          } catch (e) {
            console.error('No se pudieron obtener roles al finalizar partida:', e);
          }
        }
        if (!cancelled) setResolvedWinnerNames(names || []); // Guardamos [] si no se resuelve
      } else {
         // Si el asesino NO ganó y no hay winners, los ganadores son implícitamente los detectives
         if (!cancelled) setResolvedWinnerNames([]); 
      }
    };
    compute();
    return () => { cancelled = true; };
  }, [winners, asesinoGano, roles, players, gameId, setRoles]);

  let mensaje = 'Calculando resultado...';
  if (resolvedWinnerNames !== null) {
    if (asesinoGano) {
      if (resolvedWinnerNames.length === 0) {
        mensaje = "¡El Asesino se escapó!"; // Asesino ganó, pero no pudimos obtener el nombre
      } else if (resolvedWinnerNames.length === 1) {
        mensaje = `¡El asesino ${resolvedWinnerNames[0]} ganó la partida!`; // Gana solo el asesino
      } else {
        mensaje = `¡El asesino y su cómplice (${resolvedWinnerNames.join(', ')}) ganaron la partida!`; // Ganan ambos
      }
    } else {
      // Si asesinoGano es false
      mensaje = "¡Ganan los detectives!"; 
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>¡Fin de partida!</h2>
        {resolvedWinnerNames !== null && <p className={styles.winnerText}>{mensaje}</p>}
        {resolvedWinnerNames === null && <p className={styles.winnerText}>Cargando resultado...</p>} 
        <button onClick={onReturnToMenu} className={styles.returnButton}>
          Volver al menú principal
        </button>
      </div>
    </div>
  );
};
GameOverModal.propTypes = {
  winners: PropTypes.arrayOf(PropTypes.string).isRequired,
  asesinoGano: PropTypes.bool.isRequired,
  onReturnToMenu: PropTypes.func.isRequired,
  players: PropTypes.array,
  roles: PropTypes.shape({
    murdererId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    accompliceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  setRoles: PropTypes.func,
  gameId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default GameOverModal;