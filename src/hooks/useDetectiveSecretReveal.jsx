import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';
import PlayerSelectModal from '@/components/UI/PlayerSelectModal/PlayerSelectModal.jsx';
import SecretsModal from '@/components/SecretsModal/SecretsModal.jsx';
import websocketService from '@/services/websocketService';


export default function useDetectiveSecretReveal(gameId, gameState, players) {
  const { currentPlayerId } = gameState;

  const [isPlayerSelectOpen, setIsPlayerSelectOpen] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [targetSecrets, setTargetSecrets] = useState([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [isSecretsOpen, setIsSecretsOpen] = useState(false);
  const [flowMode, setFlowMode] = useState(null); // 'detective' | 'lady' | 'parker'
  const [lastRepId, setLastRepId] = useState(null);

  const shouldTriggerForDetective = (representacion_id) => representacion_id === 7 || representacion_id === 8;
  // Efecto "elige el objetivo y el objetivo elige el secreto": Lady Brent (11) y Hermanos Beresford (Tommy=12, Tuppence=13)
  const isTargetChoiceRep = (representacion_id) => representacion_id === 11 || representacion_id === 12 || representacion_id === 13;
  // Parker Pyne (10): el jugador que juega el set elige objetivo y selecciona un secreto REVELADO de ese jugador para ocultar
  const isParkerPyne = (representacion_id) => representacion_id === 10;

  // Handler para el evento jugar-set del WebSocket
  const handleSetPlayedEvent = useCallback((payload, currentPlayerIdArg) => {
    const jugador_id = payload?.jugador_id;
    const representacion_id = payload?.representacion_id;
    const myId = currentPlayerIdArg ?? currentPlayerId;
    if (jugador_id === myId) {
      setLastRepId(representacion_id);
      if (shouldTriggerForDetective(representacion_id)) {
        setFlowMode('detective');
        setTargetPlayer(null);
        setIsPlayerSelectOpen(true);
      } else if (isTargetChoiceRep(representacion_id)) {
        setFlowMode('lady');
        setTargetPlayer(null);
        setIsPlayerSelectOpen(true);
      } else if (isParkerPyne(representacion_id)) {
        setFlowMode('parker');
        setTargetPlayer(null);
        // Re-evaluar con estado fresco si hay jugadores con secretos revelados
        const anyRevealed = (players || []).some(p => (gameState.playersSecrets?.[p.id_jugador]?.revealed || 0) > 0);
        if (!anyRevealed) {
          alert('Ningún jugador tiene secretos revelados.');
          setFlowMode(null);
          return;
        }
        setIsPlayerSelectOpen(true);
      }
    }
  }, [currentPlayerId, players, gameState.playersSecrets]);

  const others = useMemo(() => (players || []).filter(p => p.id_jugador !== currentPlayerId), [players, currentPlayerId]);
  const parkerCandidates = useMemo(() => {
    const revealedCount = (pid) => (gameState.playersSecrets?.[pid]?.revealed || 0);
    return (players || []).filter(p => revealedCount(p.id_jugador) > 0);
  }, [players, gameState.playersSecrets]);

  const onSelectPlayer = useCallback(async (player) => {
    setTargetPlayer(player);
    setIsPlayerSelectOpen(false);
    if (flowMode === 'detective') {
      setIsLoadingSecrets(true);
      try {
        const raw = await apiService.getPlayerSecrets(gameId, player.id_jugador);
        const mapped = raw.map(s => {
          if (s.bocaArriba && s.carta_id) {
            const card = cardService.getSecretCards([{ id: s.carta_id }])[0];
            return { ...s, url: card?.url };
          }
          return s;
        });
        setTargetSecrets(mapped);
        setIsSecretsOpen(true);
      } catch (e) {
        console.error('No se pudieron obtener los secretos del jugador objetivo:', e);
        setTargetSecrets([]);
      } finally {
        setIsLoadingSecrets(false);
      }
    } else if (flowMode === 'lady') {
      try {
        const motivo = lastRepId === 11 ? 'lady-brent' : 'beresford';
        await apiService.requestTargetToRevealSecret(gameId, currentPlayerId, player.id_jugador, motivo);
      } catch (e) {
        console.error('No se pudo solicitar revelación al objetivo:', e);
        alert(e.message || 'No se pudo solicitar revelación');
      } finally {
        setTargetPlayer(null);
        setFlowMode(null);
      }
    } else if (flowMode === 'parker') {
      // Cargar secretos del objetivo y permitir seleccionar SOLO los revelados para ocultar
      setIsLoadingSecrets(true);
      try {
        const raw = await apiService.getPlayerSecrets(gameId, player.id_jugador);
        const mapped = raw.map(s => {
          if (s.bocaArriba && s.carta_id) {
            const card = cardService.getSecretCards([{ id: s.carta_id }])[0];
            return { ...s, url: card?.url };
          }
          return s;
        });
        const hasRevealed = mapped.some(s => s.bocaArriba || s.revelada || s.revelado);
        if (!hasRevealed) {
          alert('El jugador seleccionado no tiene secretos revelados.');
          setTargetPlayer(null);
          setFlowMode(null);
          return;
        }
        setTargetSecrets(mapped);
        setIsSecretsOpen(true);
      } catch (e) {
        console.error('No se pudieron obtener los secretos del jugador objetivo:', e);
        setTargetSecrets([]);
      } finally {
        setIsLoadingSecrets(false);
      }
    }
  }, [gameId, currentPlayerId, flowMode, lastRepId]);

  const onSelectSecret = useCallback(async (secret) => {
    if (!targetPlayer) return;
    try {
      await apiService.revealSecret(gameId, targetPlayer.id_jugador, secret.id);
      setIsSecretsOpen(false);
      setTargetPlayer(null);
      setTargetSecrets([]);
    } catch (e) {
      console.error('Error al revelar secreto:', e);
      alert(e.message || 'No se pudo revelar el secreto');
    }
  }, [gameId, targetPlayer]);

  const onSelectSecretToHide = useCallback(async (secret) => {
    if (!targetPlayer) return;
    try {
      await apiService.hideSecret(gameId, targetPlayer.id_jugador, secret.id);
      setIsSecretsOpen(false);
      setTargetPlayer(null);
      setTargetSecrets([]);
    } catch (e) {
      console.error('Error al ocultar secreto:', e);
      alert(e.message || 'No se pudo ocultar el secreto');
    }
  }, [gameId, targetPlayer]);

  // Lady Brent: el objetivo recibe solicitud personal y debe elegir su propio secreto a revelar
  const [isPersonalSecretsOpen, setIsPersonalSecretsOpen] = useState(false);
  const [mySecretsForSelection, setMySecretsForSelection] = useState([]);
  useEffect(() => {
    const onPersonalRequest = async () => {
      try {
        // Importante: usar secretos del jugador (secretosjugador) que incluyen el id UNICO de carta
        const raw = await apiService.getPlayerSecrets(gameId, currentPlayerId);
        // Mostrar revelados face-up: mapear carta_id a url cuando bocaArriba
        const mapped = raw.map(s => {
          if (s.bocaArriba && s.carta_id) {
            const card = cardService.getSecretCards([{ id: s.carta_id }])[0];
            return { ...s, url: card?.url };
          }
          return s;
        });
        setMySecretsForSelection(mapped);
        setIsPersonalSecretsOpen(true);
      } catch (e) {
        console.error('No se pudieron cargar mis secretos para la selección:', e);
      }
    };
    websocketService.on('solicitar-revelacion-secreto', onPersonalRequest);
    return () => websocketService.off('solicitar-revelacion-secreto', onPersonalRequest);
  }, [gameId, currentPlayerId]);

  const onSelectMySecret = useCallback(async (secret) => {
    try {
      await apiService.revealSecret(gameId, currentPlayerId, secret.id);
      setIsPersonalSecretsOpen(false);
      setMySecretsForSelection([]);
    } catch (e) {
      console.error('Error al revelar mi secreto (Lady Brent):', e);
      alert(e.message || 'No se pudo revelar el secreto');
    }
  }, [gameId, currentPlayerId]);

  const modals = (
    <>
      <PlayerSelectModal
        isOpen={isPlayerSelectOpen}
        onClose={() => setIsPlayerSelectOpen(false)}
        players={flowMode === 'parker' ? parkerCandidates : others}
        title={flowMode === 'parker' ? 'Selecciona un jugador para ocultar un secreto revelado' : 'Selecciona un jugador para revelar un secreto'}
        onSelect={onSelectPlayer}
      />
      <SecretsModal
        isOpen={isSecretsOpen}
        onClose={() => { setIsSecretsOpen(false); setTargetPlayer(null); setTargetSecrets([]); }}
        player={targetPlayer}
        secrets={targetSecrets}
        isLoading={isLoadingSecrets}
        selectable={true}
        selectRevealedOnly={flowMode === 'parker'}
        onSelect={flowMode === 'parker' ? onSelectSecretToHide : onSelectSecret}
      />
      <SecretsModal
        isOpen={isPersonalSecretsOpen}
        onClose={() => { setIsPersonalSecretsOpen(false); setMySecretsForSelection([]); }}
        player={(players || []).find(p => p.id_jugador === currentPlayerId)}
        secrets={mySecretsForSelection}
        isLoading={false}
        selectable={true}
        onSelect={onSelectMySecret}
      />
    </>
  );

  return { handleSetPlayedEvent, modals };
}
