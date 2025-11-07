import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiService } from '@/services/apiService';

const NOT_SO_FAST_WINDOW_MS = 5000;

const useActionStack = (gameId, currentPlayerId) => {
    const [accionEnProgreso, setAccionEnProgreso] = useState(null);
    const [actionResultMessage, setActionResultMessage] = useState(null);

    const procesarAccionDesdeWS = useCallback((message) => {
        if (!message || !message.data) return null;

        const data = message.data;

        if (data.carta_original) return data;

        const tipoIdParaMostrar = data.id_carta_tipo_original || 0;

        console.log(`[useActionStack] Procesando WS. Mostrando TipoID: ${tipoIdParaMostrar}`, data);
        return {
            ...data,
            mensaje: message.mensaje,
            carta_original: {
                id_jugador: data.id_jugador_original,
                nombre: data.nombre_accion,
                id_carta_tipo: tipoIdParaMostrar,
            },
        };
    }, []);

    const ejecutarAccionOriginal = useCallback(
        (accion) => {
            console.log(`[useActionStack] 🟢 EJECUTANDO ACCIÓN: ${accion.tipo_accion}`, accion);
            const { tipo_accion, payload_original, cartas_originales_db_ids, id_carta_tipo_original } = accion;

            const id_carta_jugada = cartas_originales_db_ids[0];
            const id_tipo_carta = id_carta_tipo_original;

            switch (tipo_accion) {
                case 'evento_another_victim':
                    return apiService.playAnotherVictim(gameId, currentPlayerId, id_tipo_carta, payload_original);
                case 'evento_ariadne_oliver': {
                    // Jugar Ariadne en el set objetivo y luego solicitar revelación al objetivo
                    const repId = payload_original?.id_representacion_carta;
                    const targetPlayerId = payload_original?.id_objetivo;
                    return apiService
                        .playAriadneOliver(gameId, currentPlayerId, repId)
                        .then(() => apiService.requestTargetToRevealSecret(gameId, currentPlayerId, targetPlayerId, 'ariadne-oliver'));
                }
                case 'evento_one_more':
                    return apiService.playOneMore(gameId, currentPlayerId, id_tipo_carta, payload_original);
                case 'evento_early_train':
                    return apiService.playEarlyTrainToPaddington(gameId, currentPlayerId, id_tipo_carta);
                case 'evento_delay_escape':
                    return apiService.playDelayTheMurdererEscape(gameId, currentPlayerId, id_tipo_carta, payload_original.cantidad);
                case 'jugar_set_detective':
                    return apiService.playDetectiveSet(gameId, currentPlayerId, payload_original.set_cartas);
                case 'evento_card_trade':
                    return apiService.cardTrade(gameId, currentPlayerId, id_carta_jugada,payload_original.id_objetivo);
                default:
                    console.error(`Acción original no reconocida: ${tipo_accion}`);
            }
        },
        [gameId, currentPlayerId]
    );

    useEffect(() => {
        if (accionEnProgreso) {
            // --- ARREGLO Y LOG ---
            // 1. EL ARREGLO: Guardamos un "snapshot" de la acción
            //    para evitar la Race Condition.
            console.log("[useActionStack] ⏱️ TIMER INICIADO. Guardando snapshot de acción.", accionEnProgreso);
            const accionAlIniciarTimer = accionEnProgreso;
            const somosElActor = accionAlIniciarTimer.id_jugador_original === currentPlayerId;
            const delay = somosElActor ? NOT_SO_FAST_WINDOW_MS : (NOT_SO_FAST_WINDOW_MS + 2000);

            const timerId = setTimeout(() => {
                console.log('[useActionStack] 🔔 Timer finalizado. Llamando a /resolver-accion (HTTP)...');

                apiService
                    .resolverAccion(gameId)
                    .then((respuesta) => {
                        console.log('[useActionStack] ✅ Respuesta HTTP de /resolver-accion RECIBIDA:', respuesta);
                        console.log('[useActionStack]     ...revisando contra snapshot:', accionAlIniciarTimer);
                        console.log(`[useActionStack]     ...¿es nuestro turno? ${somosElActor}`);

                        // --- ARREGLO ---
                        // 2. Usamos el "snapshot" (accionAlIniciarTimer) en lugar del
                        //    estado (accionEnProgreso), que podría estar null.
                        if (
                            respuesta.decision === 'ejecutar' &&
                            somosElActor
                        ) {
                            // --- NUEVO LOG ---
                            console.log('[useActionStack]     ...¡Condición CUMPLIDA! Llamando a ejecutarAccionOriginal.');
                            // --- FIN LOG ---
                            ejecutarAccionOriginal(accionAlIniciarTimer);
                        } else {
                            // --- NUEVO LOG ---
                            console.log('[useActionStack]     ...Condición NO CUMPLIDA. No se ejecuta nada.');
                            if (respuesta.decision !== 'ejecutar')
                                console.log(`[useActionStack]         ...Razón: La decisión fue "${respuesta.decision}".`);
                            if (accionAlIniciarTimer.id_jugador_original !== currentPlayerId)
                                console.log('[useActionStack]         ...Razón: No somos el jugador original.');
                            // --- FIN LOG ---
                        }
                        // --- FIN ARREGLO ---
                    })
                    .catch((err) => {
                        if (err.message.includes('La acción ya fue resuelta')) {
                            console.log('[useActionStack] 🔵 La acción ya fue resuelta por otro cliente (HTTP).');
                        } else {
                            console.error('Error al resolver la acción:', err);
                            alert('Error al resolver la acción: ' + err.message);
                        }
                    });
            }, delay);

            return () => {
                clearTimeout(timerId);
            };
        }
    }, [accionEnProgreso, gameId, currentPlayerId, ejecutarAccionOriginal]);

    const iniciarAccionCancelable = useCallback(
        async (payload) => {
            if (!gameId || !currentPlayerId) return;
            try {
                // --- NUEVO LOG ---
                console.log('[useActionStack] 📤 Enviando (HTTP) /iniciar-accion...', payload);
                // --- FIN LOG ---
                await apiService.iniciarAccion(gameId, currentPlayerId, payload);
            } catch (error) {
                console.error('Error al iniciar la acción:', error);
                alert(`Error al proponer la acción: ${error.message}`);
            }
        },
        [gameId, currentPlayerId]
    );

    const wsCallbacks = useMemo(
        () => ({
            onAccionEnProgreso: (message) => {
                console.log('[useActionStack] ⚡️ Evento WebSocket "accion-en-progreso" RECIBIDO.', message);
                setAccionEnProgreso(procesarAccionDesdeWS(message));
            },
            onPilaActualizada: (message) => {
                console.log('[useActionStack] ⚡️ Evento WebSocket "pila-actualizada" RECIBIDO.', message);
                setAccionEnProgreso(procesarAccionDesdeWS(message));
            },
            onAccionResuelta: (message) => {
                console.log('[useActionStack] ⚡️ Evento WebSocket "accion-resuelta" RECIBIDO. Limpiando estado.', message);
                setAccionEnProgreso(null);
                setActionResultMessage(message.detail || 'Acción resuelta.');
            },
        }),
        [procesarAccionDesdeWS]
    );

    return {
        accionEnProgreso,
        actionResultMessage,
        setActionResultMessage,
        iniciarAccionCancelable,
        wsCallbacks,
    };
};

export default useActionStack;
