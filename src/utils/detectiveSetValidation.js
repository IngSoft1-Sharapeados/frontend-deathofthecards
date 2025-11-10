const DETECTIVE_IDS = new Set([7, 8, 9, 10, 11, 12, 13, 14]);
const WILDCARD_ID = 14;

// Required set sizes per detective id
const REQUIRED_SIZES = {
  7: 3, // Poirot
  8: 3, // Miss Marple
  9: 2, // Mr Satterthwaite
  10: 2, // Parker Pyne
  11: 2, // Lady Brent
  12: 2, // Tommy
  13: 2, // Tuppence
};

// Returns true if selected instanceIds from hand form a valid set
export function isValidDetectiveSet(hand, selectedInstanceIds) {
  if (!Array.isArray(hand) || !Array.isArray(selectedInstanceIds)) return false;
  if (selectedInstanceIds.length < 2 || selectedInstanceIds.length > 3) return false; // only 2 or 3 sized sets are valid

  // Map selected instanceIds to card ids
  const selectedCards = selectedInstanceIds
    .map((iid) => hand.find((c) => c.instanceId === iid))
    .filter(Boolean);

  if (selectedCards.length !== selectedInstanceIds.length) return false; // missing cards

  // All must be detectives (id 7..15)
  if (selectedCards.some((c) => !DETECTIVE_IDS.has(c.id))) return false;

  const ids = selectedCards.map((c) => c.id);
  const size = ids.length;
  const wildcardCount = ids.filter((id) => id === WILDCARD_ID).length;
  const nonWildcardIds = ids.filter((id) => id !== WILDCARD_ID);

  // Two-card sets logic
  if (size === 2) {
    const [a, b] = ids;
    // Tommy + Tuppence pair directly
    if ((ids.includes(12) && ids.includes(13))) return true;

    // same type or one wildcard + a valid 2-of-kind type
    const target = nonWildcardIds[0];
    if (nonWildcardIds.length === 1 && wildcardCount === 1) {
      // wildcard + one card; valid if that card requires size 2
      return REQUIRED_SIZES[target] === 2;
    }

    if (wildcardCount === 0 && a === b) {
      return REQUIRED_SIZES[a] === 2;
    }
    return false;
  }

  // Three-card sets logic (only Poirot or Marple, with or without wildcards)
  if (size === 3) {
    // All non-wildcards must be same type and that type must require 3
    const uniqueNonWild = Array.from(new Set(nonWildcardIds));
    if (uniqueNonWild.length !== 1) return false;
    const target = uniqueNonWild[0];
    if (REQUIRED_SIZES[target] !== 3) return false;
    // the remaining slots can be wildcards; any combination like 3 same, 2 same + 1 wildcard, 1 same + 2 wildcards
    return true;
  }

  return false;
}

export function canAddCardToSet(hand, selectedInstanceIds, playedSets) {
  if (!Array.isArray(selectedInstanceIds) || selectedInstanceIds.length !== 1) {
    return false;
  }

  // Encontrar la carta seleccionada en la mano
  const card = hand.find((c) => c.instanceId === selectedInstanceIds[0]);
  if (!card) {
    return false;
  }

  const cardId = card.id;

  // No se puede añadir un comodín a un set existente
  if (cardId === WILDCARD_ID) {
    return false;
  }

  // La carta debe ser un detective
  if (!DETECTIVE_IDS.has(cardId)) {
    return false;
  }

  // El jugador debe tener sets ya jugados
  if (!Array.isArray(playedSets) || playedSets.length === 0) {
    return false;
  }

  // Comprobar si el jugador tiene un set jugado del MISMO TIPO
  return playedSets.some(set => set.representacion_id_carta === cardId);
}


export default { isValidDetectiveSet, canAddCardToSet };