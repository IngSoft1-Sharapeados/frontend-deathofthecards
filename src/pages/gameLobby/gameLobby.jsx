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
    const [isHost, setIsHost] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [starting, setStarting] = useState(false);

    // Cargar currentPlayerId y hostId desde sessionStorage
    useEffect(() => {
        const savedPlayerId = sessionStorage.getItem('playerId');
        const savedHostId = sessionStorage.getItem('hostId');
        if (savedPlayerId) {
            setCurrentPlayerId(parseInt(savedPlayerId, 10));
            console.log("PlayerId encontrado en sessionStorage:", savedPlayerId);
        }
        if (savedHostId) {
            setHostId(parseInt(savedHostId, 10));
            console.log("HostId encontrado en sessionStorage:", savedHostId);
        }
    }, []);

    //  Traer datos de la partida desde el backend
    useEffect(() => {
        if (!gameId) return;

        const fetchLobbyData = async () => {
            try {
                setIsLoading(true);
                const data = await apiService.getGameDetails(gameId);

                setGameName(data.nombre_partida);
                setPlayers(data.listaJugadores);
                setMinPlayers(data.minJugadores);

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

    //  Derivar isHost solo cuando currentPlayerId y hostId estén definidos
    useEffect(() => {
        if (currentPlayerId != null && hostId != null) {
            const hostStatus = currentPlayerId === hostId;
            setIsHost(hostStatus);
            console.log({ currentPlayerId, hostId, isHost: hostStatus, isLoading });
        }
    }, [currentPlayerId, hostId, isLoading]);

    //  Función para iniciar partida
    const handleStartGame = async () => {
        if (!currentPlayerId) {
            alert("No se pudo identificar tu jugador. Recarga la página.");
            return;
        }

        try {
            setStarting(true);
            await apiService.startGame(gameId, currentPlayerId);
            navigate(`/partidas/${gameId}/juego`);  
        } catch (err) {
            alert("No se pudo iniciar la partida. Intente nuevamente.");
        }
    };

    if (isLoading) return <div className={styles.loadingSpinner}></div>;
    if (error) return <p>{error}</p>;

    return (
        <div className={styles.lobbyContainer}>
            <header className={styles.lobbyHeader}>
                <h1 className={styles.gameTitle}>{gameName}</h1>
            </header>

            <main className={styles.mainContent}>
                <PlayerList players={players} />

                {isHost ? (
                    <button
                        className={styles.startButton}
                        onClick={handleStartGame}
                        disabled={players.length < minPlayers || starting}
                    >
                        {starting
                            ? "Iniciando..."
                            : `Iniciar partida (${players.length}/${minPlayers})`}
                    </button>
                ) : (
                    <p>
                        Esperando que el anfitrión inicie la partida... (
                        {players.length}/{minPlayers} jugadores)
                    </p>
                )}
            </main>
        </div>
    );
};

export default GameLobbyPage;