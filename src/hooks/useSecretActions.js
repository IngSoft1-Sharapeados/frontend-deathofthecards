import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { cardService } from '@/services/cardService';


const processSecrets = (secretsFromApi) => {
  if (!Array.isArray(secretsFromApi)) return [];
  return secretsFromApi.map(secret => {
    if (secret.bocaArriba) {
      const cardDetails = cardService.getSecretCards([{ id: secret.carta_id }])[0];
      return { 
        ...secret, 
        ...cardDetails,
         id: secret.id 
       };
    }
    return secret;
  });
};

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

  const handleRevealSecret = useCallback(async (viewingPlayerId) => {
    if (!selectedSecretCard || !canRevealSecrets || !viewingPlayerId) return;

    try {

      const response = await apiService.revealSecret(gameId, currentPlayerId, selectedSecretCard);

      const freshSecrets = await apiService.getPlayerSecrets(gameId, viewingPlayerId);

      setPlayerSecretsData(processSecrets(freshSecrets));
      
      setSelectedSecretCard(null);
      setCanRevealSecrets(true); //luego de revelar una carta de secreto ya no se puede aplicar el mismo efecto 
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, selectedSecretCard, canRevealSecrets, setPlayerSecretsData, setSelectedSecretCard, setCanRevealSecrets]);
  
  const handleHideSecret = useCallback(async (viewingPlayerId) => {
    if (!selectedSecretCard || !canHideSecrets || !viewingPlayerId) return;

    try {
      const response = await apiService.hideSecret(
        gameId,
        currentPlayerId,
        selectedSecretCard
      );
      const freshSecrets = await apiService.getPlayerSecrets(gameId, viewingPlayerId);

      setPlayerSecretsData(processSecrets(freshSecrets));
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
    setPlayerSecretsData,
    setCanHideSecrets,
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