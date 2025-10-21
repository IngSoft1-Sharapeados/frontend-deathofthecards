import React from 'react';
import styles from './PlayerSelectTable.module.css';

// players: [{ id_jugador, nombre_jugador }]
// onSelect(player): callback when selecting a player
const PlayerSelectTable = ({ players = [], onSelect }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Jugador</th>
            <th className={styles.th} style={{ width: 1 }}></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id_jugador} className={styles.row}>
              <td className={`${styles.td} ${styles.nameCell}`}>
                <span>{p.nombre_jugador}</span>
              </td>
              <td className={styles.td} style={{ textAlign: 'right' }}>
                <button className={styles.selectBtn} onClick={() => onSelect?.(p)}>Seleccionar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerSelectTable;
