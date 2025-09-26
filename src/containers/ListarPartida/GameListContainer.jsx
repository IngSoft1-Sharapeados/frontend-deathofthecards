import React, { useEffect, useState } from "react";
import { apiService } from "@/services/apiService.js";
import GameList from "@/components/GameList/GameList.jsx";
import PropTypes from 'prop-types';




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

  if (error) return <p>Error: {error}</p>;

  return <GameList games={games} onJoinClick={onJoinClick}/>;
};

GameListContainer.propTypes = {
  onJoinClick: PropTypes.func.isRequired
};

export default GameListContainer;