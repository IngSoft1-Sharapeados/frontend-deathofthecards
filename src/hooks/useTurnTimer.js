import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService'; // Necesario para 'handlePenalty'

export const TURN_DURATION = 40; 

export const useTurnTimer = ({
    gameId,
    currentPlayerId,
    turnStartedAt,
    currentTurn,
    hand,
    setHand,
    isMyTurn,
    playerTurnState
}) => {
    const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
    const penaltyInProgress = useRef(false);

    // Ref para evitar "race conditions" al cambiar de turno
    const isMyTurnRef = useRef(isMyTurn);
    useEffect(() => {
        isMyTurnRef.current = isMyTurn;
    }, [isMyTurn]);

    const handlePenalty = useCallback(async () => {
        penaltyInProgress.current = true;

        if (!isMyTurnRef.current || hand.length === 0 || !gameId || !currentPlayerId) {
            penaltyInProgress.current = false;
            return;
        }

        try {
            if (playerTurnState === 'discarding' && hand.length > 0) {
                const randomCard = hand[Math.floor(Math.random() * hand.length)];
                await apiService.discardCards(gameId, currentPlayerId, [randomCard.id]);
            }
            await apiService.drawCards(gameId, currentPlayerId, 1);

            // nueva mano
            const freshHandData = await apiService.getHand(gameId, currentPlayerId);
            const playingHand = cardService.getPlayingHand(freshHandData);
            const handWithInstanceIds = playingHand.map((card, index) => ({
                ...card,
                instanceId: `card-inst-${card.id_instancia}`
            }));
            setHand(handWithInstanceIds);

        } catch (error) {
            penaltyInProgress.current = false;
        }

    }, [hand, gameId, currentPlayerId, playerTurnState, setHand]);


    useEffect(() => {
        // Si el turno no ha comenzado, solo resetea.
        if (!turnStartedAt) {
            setTimeLeft(TURN_DURATION);
            penaltyInProgress.current = false;
            return; // No iniciar intervalo
        }

        // Si el timer debe (re)iniciar (porque 'turnStartedAt' o 'currentTurn' cambiaron)
        setTimeLeft(TURN_DURATION);
        penaltyInProgress.current = false;

        // Iniciar el intervalo
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsedMs = now - turnStartedAt;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const remaining = TURN_DURATION - elapsedSeconds;

            setTimeLeft(remaining < 0 ? 0 : remaining);
        }, 500);

        // Limpieza
        return () => clearInterval(interval);

    }, [turnStartedAt, currentTurn]);


    useEffect(() => {
        // Solo depende de timeLeft.
        if (timeLeft === 0) {
            // Usa la ref 'isMyTurnRef' para chequear el estado actual.
            if (isMyTurnRef.current && !penaltyInProgress.current) {
                handlePenalty();
            }
        }
    }, [timeLeft, handlePenalty]);


    return { timeLeft };
};