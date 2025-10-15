import { useCallback } from 'react';
import { apiService } from '@/services/apiService';

const useSecretActions = (gameId, gameState) => {
  const {
    currentPlayerId,
    playerSecretsData, setPlayerSecretsData,
    selectedSecretCard, setSelectedSecretCard,
    canRevealSecrets, setCanRevealSecrets, 
    canHideSecrets, setCanHideSecrets
  } = gameState;

  const handleSecretCardClick = useCallback((secretId) => {
    if (!canRevealSecrets && !canHideSecrets) return;
    setSelectedSecretCard(prev => prev === secretId ? null : secretId);
  }, [canRevealSecrets, canHideSecrets, setSelectedSecretCard]);

  const handleRevealSecret = useCallback(async () => {
    if (!selectedSecretCard || !canRevealSecrets) return;

    try {
        console.log("➡️ Enviando revelación:", {
          gameId,
          currentPlayerId,
          selectedSecretCard
        });
      const response = await apiService.revealSecret(gameId, currentPlayerId, selectedSecretCard);
      console.log("Secreto revelado:", response);
      
      // Actualizar los datos locales
      setPlayerSecretsData(prev => prev.filter(secret => secret.id !== selectedSecretCard));
      setSelectedSecretCard(null);
      setCanRevealSecrets(true); //luego de revelar una carta de secreto ya no se puede aplicar el mismo efecto 
      setCanHideSecrets(true);
    } catch (error) {
      console.error("Error al revelar secreto:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, selectedSecretCard, canRevealSecrets, setPlayerSecretsData, setSelectedSecretCard, setCanRevealSecrets]);
  
  const handleHideSecret = useCallback(async () => {
    if (!selectedSecretCard || !canHideSecrets) return;

    try {
      console.log("➡️ Enviando ocultamiento:", {
        gameId,
        currentPlayerId,
        selectedSecretCard,
      });
      const response = await apiService.hideSecret(
        gameId,
        currentPlayerId,
        selectedSecretCard
      );
      console.log("Secreto oculto:", response);

      setPlayerSecretsData(prev => prev.filter(secret => secret.id !== selectedSecretCard));
      setSelectedSecretCard(null);
      setCanHideSecrets(true); //luego de ocultar una carta de secreto ya no se puede aplicar el mismo efecto
      
    } catch (error) {
      console.error("Error al ocultar secreto:", error);
      alert(`Error: ${error.message}`);
    }
  }, [
    gameId,
    currentPlayerId,
    selectedSecretCard,
    canHideSecrets,
    setSelectedSecretCard,
  ]);

  return {
    handleSecretCardClick,
    handleRevealSecret,
    handleHideSecret
  };
};


export default useSecretActions;