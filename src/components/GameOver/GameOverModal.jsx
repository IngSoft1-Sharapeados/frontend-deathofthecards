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
  return names.length ? names : null;
};

const GameOverModal = ({
  winners,
  asesinoGano,
  onReturnToMenu,
  // Nuevos props para resolver ganadores dentro del modal
  players = [],
  roles = { murdererId: null, accompliceId: null },
  setRoles, // opcional: para propagar roles obtenidos al padre
  gameId,
}) => {
  const [computedWinners, setComputedWinners] = useState([]);

  // Calcular o re-calcular ganadores si la lista recibida está vacía
  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      // Si vienen ganadores no vacíos desde props, úsalos directamente
      if (Array.isArray(winners) && winners.length > 0) {
        if (!cancelled) setComputedWinners(winners);
        return;
      }

      // Primero intentar con roles ya presentes en memoria
      let names = resolveWinners(roles, players) || [];

      // Fallback: obtener roles desde backend si no se pudieron resolver
      if (names.length === 0 && gameId) {
        try {
          const rolesData = await apiService.getRoles(gameId);
          const fetchedRoles = {
            murdererId: rolesData?.['asesino-id'] ?? null,
            accompliceId: rolesData?.['complice-id'] ?? null,
          };
          const recalculated = resolveWinners(fetchedRoles, players) || [];
          if (!cancelled) setComputedWinners(recalculated);
          // Propagar roles hacia el padre si se provee setter y no estaban establecidos
          if (typeof setRoles === 'function' && !roles?.murdererId && fetchedRoles.murdererId) {
            setRoles(fetchedRoles);
          }
          return;
        } catch (e) {
          console.error('No se pudieron obtener roles al finalizar partida:', e);
        }
      }

      if (!cancelled) setComputedWinners(names);
    };

    compute();
    return () => { cancelled = true; };
  }, [winners, roles, players, gameId, setRoles]);

  const winnersToShow = useMemo(() => {
    return (Array.isArray(computedWinners) && computedWinners.length > 0)
      ? computedWinners
      : (Array.isArray(winners) ? winners : []);
  }, [computedWinners, winners]);

  let mensaje = '';
  if (asesinoGano && winnersToShow.length === 1) {
    mensaje = `El asesino ${winnersToShow[0]} ganó la partida`;
  }
  else if (asesinoGano && winnersToShow.length > 1) {
    mensaje = `El asesino y su cómplice (${winnersToShow.join(', ')}) ganaron la partida`;
  }
  else {
    mensaje = `${winnersToShow.join(', ')} ${winnersToShow.length > 1 ? 'ganaron' : 'ganó'} la partida`;
  }
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>¡Fin de partida!</h2>
        <p className={styles.winnerText}>{mensaje}</p>
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
  // Nuevos props opcionales
  players: PropTypes.array,
  roles: PropTypes.shape({
    murdererId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    accompliceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  setRoles: PropTypes.func,
  gameId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default GameOverModal;
