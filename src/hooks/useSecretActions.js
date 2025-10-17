import { useCallback } from 'react';
import { apiService } from '@/services/apiService';

const useSecretActions = (gameId, gameState) => {
  const {
    currentPlayerId,
    playerSecretsData, setPlayerSecretsData,
    selectedSecretCard, setSelectedSecretCard,
    canRevealSecrets, setCanRevealSecrets, 
    canHideSecrets, setCanHideSecrets,
    canRobSecrets, setCanRobSecrets
  } = gameState;

  const handleSecretCardClick = useCallback((secretId) => {
    if (!canRevealSecrets && !canHideSecrets) return;
    setSelectedSecretCard(prev => prev === secretId ? null : secretId);
  }, [canRevealSecrets, canHideSecrets, setSelectedSecretCard]);

  const handleRevealSecret = useCallback(async () => {
    if (!selectedSecretCard || !canRevealSecrets) return;

    try {

      const response = await apiService.revealSecret(gameId, currentPlayerId, selectedSecretCard);
      
      // Actualizar los datos locales
      setPlayerSecretsData(prev => prev.filter(secret => secret.id !== selectedSecretCard));
      setSelectedSecretCard(null);
      setCanRevealSecrets(true); //luego de revelar una carta de secreto ya no se puede aplicar el mismo efecto 
      setCanHideSecrets(true);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, selectedSecretCard, canRevealSecrets, setPlayerSecretsData, setSelectedSecretCard, setCanRevealSecrets]);
  
  const handleHideSecret = useCallback(async () => {
    if (!selectedSecretCard || !canHideSecrets) return;

    try {
      const response = await apiService.hideSecret(
        gameId,
        currentPlayerId,
        selectedSecretCard
      );
      setPlayerSecretsData(prev => prev.filter(secret => secret.id !== selectedSecretCard));
      setSelectedSecretCard(null);
      setCanHideSecrets(true); 
      // setCanHideSecrets(false); luego de ocultar una carta de secreto ya no se puede aplicar el mismo efecto
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }, [
    gameId,
    currentPlayerId,
    selectedSecretCard,
    canHideSecrets,
    setSelectedSecretCard,
  ]);

  const handleRobSecret = useCallback(async (playerIdDestino) => {
    if (!selectedSecretCard || !canRobSecrets) return;
  
    try {
    
      const response = await apiService.robSecret(
        gameId,
        currentPlayerId,
        playerIdDestino,
        selectedSecretCard
      );
    
      // Actualizar localmente
      setPlayerSecretsData(prev => prev.filter(s => s.id !== selectedSecretCard));
      setSelectedSecretCard(null);
      setCanRobSecrets(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }, [
    gameId,
    currentPlayerId,
    selectedSecretCard,
    canRobSecrets,
    setPlayerSecretsData,
    setSelectedSecretCard,
    setCanRobSecrets
  ]);
  return {
    handleSecretCardClick,
    handleRevealSecret,
    handleHideSecret,
    handleRobSecret
  };
};


export default useSecretActions;