import React, { useEffect, useState } from "react";
import { apiService } from "@/services/apiService.js";
import GameList from "@/components/GameList/GameList.jsx";
import PropTypes from 'prop-types';

const mockGames = [
  {
    id: 1,
    name: "Partida de Prueba 1",
    minPlayers: 2,
    maxPlayers: 4,
    currentPlayers: 1,
  },
  {
    id: 2,
    name: "La Venganza del Mockcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    minPlayers: 3,
    maxPlayers: 6,
    currentPlayers: 4,
  },
  {
    id: 3,
    name: "Aventura en Frontend",
    minPlayers: 2,
    maxPlayers: 2,
    currentPlayers: 2,
  },
    {
    id: 1,
    name: "Partida de Prueba 1",
    minPlayers: 2,
    maxPlayers: 4,
    currentPlayers: 1,
  },
  {
    id: 2,
    name: "La Venganza del Mock",
    minPlayers: 3,
    maxPlayers: 6,
    currentPlayers: 4,
  },
  {
    id: 3,
    name: "Aventura en Frontend",
    minPlayers: 2,
    maxPlayers: 2,
    currentPlayers: 2,
  },

    {
    id: 1,
    name: "Partida de Prueba 1",
    minPlayers: 2,
    maxPlayers: 4,
    currentPlayers: 1,
  },
  {
    id: 2,
    name: "La Venganza del Mock",
    minPlayers: 3,
    maxPlayers: 6,
    currentPlayers: 4,
  },
  {
    id: 3,
    name: "Aventura en Frontend",
    minPlayers: 2,
    maxPlayers: 2,
    currentPlayers: 2,
  },  {
    id: 1,
    name: "Partida de Prueba 1",
    minPlayers: 2,
    maxPlayers: 4,
    currentPlayers: 1,
  },
  {
    id: 2,
    name: "La Venganza del Mock",
    minPlayers: 3,
    maxPlayers: 6,
    currentPlayers: 4,
  },
  {
    id: 3,
    name: "Aventura en Frontend",
    minPlayers: 2,
    maxPlayers: 2,
    currentPlayers: 2,
  },
    {
    id: 1,
    name: "Partida de Prueba 1",
    minPlayers: 2,
    maxPlayers: 4,
    currentPlayers: 1,
  },
  {
    id: 2,
    name: "La Venganza del Mock",
    minPlayers: 3,
    maxPlayers: 6,
    currentPlayers: 4,
  },
  {
    id: 3,
    name: "Aventura en Frontend",
    minPlayers: 2,
    maxPlayers: 2,
    currentPlayers: 2,
  }
];


const GameListContainer = ({ onJoinClick }) => {

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await apiService.listGames();
        if (!data.error) {
            setGames(
                // mapeo a lo que espera GameCard
                data.map((p) => ({
                    id: p.id,
                    name: p.nombre,
                    minPlayers: p.minJugadores,
                    maxPlayers: p.maxJugadores,
                    currentPlayers: p.cantJugadores
                }))
            );
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  if (loading) return <p>Cargando partidas...</p>;
  if (error) return <p>Error: {error}</p>;
  if (games.length === 0) return <p>No hay partidas disponibles...</p>;

  return <GameList games={games} onJoinClick={onJoinClick}/>;
};

GameListContainer.propTypes = {
  onJoinClick: PropTypes.func.isRequired
};

export default GameListContainer;