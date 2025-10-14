import { useCallback } from 'react';
import { apiService } from '@/services/apiService';

const useSecretActions = (gameId, gameState) => {
  const {
    currentPlayerId,
    playerSecretsData, setPlayerSecretsData,
    selectedSecretCard, setSelectedSecretCard,
    canRevealSecrets, setCanRevealSecrets
  } = gameState;

  const handleSecretCardClick = useCallback((secretId) => {
    if (!canRevealSecrets) return;
    setSelectedSecretCard(prev => prev === secretId ? null : secretId);
  }, [canRevealSecrets, setSelectedSecretCard]);

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
      setCanRevealSecrets(false);
      
    } catch (error) {
      console.error("Error al revelar secreto:", error);
      alert(`Error: ${error.message}`);
    }
  }, [gameId, currentPlayerId, selectedSecretCard, canRevealSecrets, setPlayerSecretsData, setSelectedSecretCard, setCanRevealSecrets]);

  return {
    handleSecretCardClick,
    handleRevealSecret
  };
};

export default useSecretActions;