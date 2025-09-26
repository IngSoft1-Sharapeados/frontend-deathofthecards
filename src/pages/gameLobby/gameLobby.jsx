import React, { useState, useEffect } from 'react';
import PlayerList from '@/components/PlayerList/PlayerList';
import { apiService } from '@/services/apiService';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './gameLobby.module.css';

const GameLobbyPage = () => {
    const { id: gameId } = useParams();
    const navigate = useNavigate();

    const [gameName, setGameName] = useState('');
    const [players, setPlayers] = useState([]);
    const [minPlayers, setMinPlayers] = useState(2);
    const [hostId, setHostId] = useState(null);
    const [currentPlayerId, setCurrentPlayerId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const savedPlayerId = localStorage.getItem('playerId');
        if (savedPlayerId) {
            setCurrentPlayerId(parseInt(savedPlayerId));
            console.log("PlayerId encontrado en localStorage:", savedPlayerId);
        }
    }, []);


    useEffect(() => {
    if (!gameId) return;

    const fetchLobbyData = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.getGameDetails(gameId);
            setGameName(data.nombre_partida);
            setPlayers(data.listaJugadores);
            setMinPlayers(data.minJugadores);
            setHostId(data.id_anfitrion);
            console.log("Datos de partida cargados:", data);
        } catch (err) {
            console.error("Error al cargar la sala:", err);
            setError("No se pudo cargar la sala.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchLobbyData();
    }, [gameId]); 
    const handleStartGame = async () => {
        if (!currentPlayerId) {
            alert("No se pudo identificar tu jugador. Recarga la página.");
            return;
        }

        try {
            setStarting(true);
            const response = await apiService.startGame(gameId, currentPlayerId);
            if (response.success) {
                navigate(`/partidas/${gameId}/juego`);
            } else {
                alert("No se pudo iniciar la partida. Intente nuevamente.");
            }
        } catch (err) {
            alert("No se pudo iniciar la partida. Intente nuevamente.");
        } finally {
            setStarting(false);
        }
    };

    if (isLoading) return <div className={styles.loadingSpinner}></div>;
    if (error) return <p>{error}</p>;

    const isHost = currentPlayerId === hostId;
  console.log({ currentPlayerId, hostId, isHost, isLoading })
    return (
        <div className={styles.lobbyContainer}>
            <header className={styles.lobbyHeader}>
                <h1 className={styles.gameTitle}>{gameName}</h1>
                {currentPlayerId && (
                    <p className={styles.playerInfo}>Tu ID: {currentPlayerId} | Host ID: {hostId}</p>
                )}
            </header>

            <main className={styles.mainContent}>
                <PlayerList players={players} />

                {isHost ? (
                    <button
                        className={styles.startButton}
                        onClick={handleStartGame}
                        disabled={players.length < minPlayers || starting}
                    >
                        {starting ? "Iniciando..." : `Iniciar partida (${players.length}/${minPlayers})`}
                    </button>
                ) : (
                    <p>Esperando que el anfitrión inicie la partida... ({players.length}/{minPlayers} jugadores)</p>
                )}
            </main>
        </div>
    );
};

export default GameLobbyPage;