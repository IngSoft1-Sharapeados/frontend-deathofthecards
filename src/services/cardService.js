// --- Definiciones de Cartas Base ---

const HELP_CARDS = [
  {id:0, url:'00-help.png', nombre: 'Ayuda'},
  {id:2,url:'02-murder_escapes.png', nombre: 'El Asesino Escapa'},
];

const BACK_CARDS = [
  {id:1, url:'01-card_back.png', nombre: 'Dorso de Carta'},
  {id:5, url:'05-secret_back.png', nombre: 'Dorso de Secreto'},
];

const SECRET_CARDS = [
  {id:6, url:'06-secret_front.png', nombre: 'Secreto'},
  {id:3,url:'03-secret_murderer.png', nombre: 'Secreto (Asesino)'},
  {id:4,url:'04-secret_accomplice.png', nombre: 'Secreto (Cómplice)'},
];

const DETECTIVE_CARDS = [
  {id: 7, url:'07-detective_poirot.png', nombre: 'Hercule Poirot'},
  {id:8, url:'08-detective_marple.png', nombre: 'Miss Marple'},
  {id:9, url:'09-detective_satterthwaite.png', nombre: 'Mr Satterthwaite'},
  {id:10, url:'10-detective_pyne.png', nombre: 'Parker Pyne'},
  {id:11, url:'11-detective_brent.png', nombre: 'Lady Eileen "Bundle" Brent'},
  {id:12, url:'12-detective_tommyberesford.png', nombre: 'Tommy Beresford'},
  {id:13, url:'13-detective_tuppenceberesford.png', nombre: 'Tuppence Beresford'},
  {id:14, url:'14-detective_quin.png', nombre: 'Harley Quin'},
  {id:15, url:'15-detective_oliver.png', nombre: 'Oliver'},
];

const INSTANT_CARDS = [
  {id:16, url:'16-Instant_notsofast.png', nombre: 'Not So Fast'},
];

const EVENT_CARDS = [
  {id:17, url:'17-event_cardsonthetable.png', nombre: 'Cards off the Table'},
  {id:18, url:'18-event_anothervictim.png', nombre: 'Another Victim'},
  {id:19, url:'19-event_deadcardfolly.png', nombre: 'Dead Card Folly'},
  {id:20, url:'20-event_lookashes.png', nombre: 'Look Into The Ashes'},
  {id:21, url:'21-event_cardtrade.png', nombre: 'Card Trade'},
  {id:22, url:'22-event_onemore.png', nombre: 'And Then There Was One More...'},
  {id:23, url:'23-event_delayescape.png', nombre: 'Delay The Murderer Escape'},
  {id:24, url:'24-event_earlytrain.png', nombre: 'Early Train To Paddington'},
  {id:25, url:'25-event_pointsuspicions.png', nombre: 'Point Your Suspicions'},
];

const DEVIOUS_CARDS = [
  {id:26, url:'26-devious_blackmailed.png', nombre: 'Blackmailed'},
  {id:27, url:'27-devious_fauxpas.png', nombre: 'Social Faux Pas'},
];


const GAME_CARDS = [
  ...DETECTIVE_CARDS,
  ...INSTANT_CARDS,
  ...EVENT_CARDS,
  ...DEVIOUS_CARDS,
];


const ALL_CARDS_DATA = [
  ...HELP_CARDS,
  ...BACK_CARDS,
  ...SECRET_CARDS,
  ...GAME_CARDS,
].reduce((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {});

const FALLBACK_GAME_CARD = { id: -1, url: '01-card_back.png', nombre: 'Carta Desconocida' };
const FALLBACK_SECRET_CARD = { id: -1, url: '05-secret_back.png', nombre: 'Secreto Desconocido' };


// --- Funciones del Servicio ---

/**
 * Obtiene los datos de la mano.
 * Combina los datos de la BBDD (ej. id_instancia) con los datos estáticos (nombre, url).
 * @param {Array} handData - Array de objetos de la API, ej. [{id: 18, id_instancia: 101}, ...]
 * @returns {Array} Array de objetos de carta completos.
 */
const getPlayingHand = (handData) => {
  if (!Array.isArray(handData)) return [];
  return handData.map((cardData) => {
    const staticData = ALL_CARDS_DATA[cardData.id];
    if (staticData) {
      // Combina datos estáticos (url, nombre) + datos de instancia (id, id_instancia)
      return { ...staticData, ...cardData };
    }
    // Fallback: Combina datos de fallback + datos de instancia
    return { ...FALLBACK_GAME_CARD, ...cardData };
  });
}

/**
 * Obtiene los datos del draft.
 * @param {Array} draftData - Array de objetos de la API, ej. [{id: 7}, ...]
 */
const getDraftCards = (draftData) => {
  if (!Array.isArray(draftData)) return [];
  return draftData.map((cardData) => {
    const staticData = ALL_CARDS_DATA[cardData.id];
    return staticData ? { ...staticData, ...cardData } : { ...FALLBACK_GAME_CARD, ...cardData };
  });
}

/**
 * Obtiene los datos de los secretos.
 * @param {Array} secretData - Array de objetos de la API, ej. [{id: 6, id_instancia: 201}, ...]
 */
const getSecretCards = (secretData) => {
  if (!Array.isArray(secretData)) return [];
  return secretData.map((cardData) => {
    const staticData = ALL_CARDS_DATA[cardData.id];
    if (staticData) {
      return { ...staticData, ...cardData };
    }
    return { ...FALLBACK_SECRET_CARD, ...cardData };
  });
};

/**
 * Obtiene los datos estáticos de una carta de evento.
 * @param {number} cardId - ID de tipo de la carta (ej. 18)
 */
const getEventCardData = (cardId) => {
  const card = ALL_CARDS_DATA[cardId];
  // Validar que es un evento
  const isEvent = EVENT_CARDS.some(c => c.id == cardId);
  return isEvent ? card : undefined;
}

/**
 * Obtiene la URL de la imagen de una carta por su ID.
 * @param {number} cardId - ID de tipo de la carta (ej. 18)
 */
const getCardImageUrl = (cardId) => {
  const card = ALL_CARDS_DATA[cardId];
  return card ? card.url : FALLBACK_GAME_CARD.url;
}

/**
 * Obtiene el nombre de la carta por su ID.
 * @param {number} cardId - ID de tipo de la carta (ej. 18)
 * @returns {string} El nombre de la carta (ej. "Another Victim")
 */
const getCardNameById = (cardId) => {
  const card = ALL_CARDS_DATA[cardId];
  return card ? card.nombre : FALLBACK_GAME_CARD.nombre;
}


const getRandomCards = (count) => {
  const shuffled = [...GAME_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomDetectives = (count) => {
  const shuffled = [...DETECTIVE_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};



export const cardService = {
  getRandomCards,
  getPlayingHand,
  getSecretCards,
  getRandomDetectives,
  getDraftCards,
  getEventCardData,
  getCardImageUrl,
  getCardNameById 
};
