const HELP_CARDS = [
  {id:0, url:'00-help.png'},
  {id:2,url:'02-murder_escapes.png'},
];

const BACK_CARDS = [
  {id:1, url:'01-card_back.png'},
  {id:5, url:'05-secret_back.png'},
];

const SECRET_CARDS = [
  {id:6, url:'06-secret_front.png'},
  {id:3,url:'03-secret_murderer.png'},
  {id:4,url:'04-secret_accomplice.png'},
];

const DETECTIVE_CARDS = [
  {id: 7, url:'07-detective_poirot.png'},
  {id:8, url:'08-detective_marple.png'},
  {id:9, url:'09-detective_satterthwaite.png'},
  {id:10, url:'10-detective_pyne.png'},
  {id:11, url:'11-detective_brent.png'},
  {id:12, url:'12-detective_tommyberesford.png'},
  {id:13, url:'13-detective_tuppenceberesford.png'},
  {id:14, url:'14-detective_quin.png'},
  {id:15, url:'15-detective_oliver.png'},
];

const INSTANT_CARDS = [
  {id:16, url:'16-Instant_notsofast.png'},
];

const EVENT_CARDS = [
  {id:17, url:'17-event_cardsonthetable.png'},
  {id:18, url:'18-event_anothervictim.png'},
  {id:19, url:'19-event_deadcardfolly.png'},
  {id:20, url:'20-event_lookashes.png'},
  {id:21, url:'21-event_cardtrade.png'},
  {id:22, url:'22-event_onemore.png'},
  {id:23, url:'23-event_delayescape.png'},
  {id:24, url:'24-event_earlytrain.png'},
  {id:25, url:'25-event_pointsuspicions.png'},
];

const DEVIOUS_CARDS = [
  {id:26, url:'26-devious_blackmailed.png'},
  {id:27, url:'27-devious_fauxpas.png'},
];


const GAME_CARDS = [
  ...DETECTIVE_CARDS,
  ...INSTANT_CARDS,
  ...EVENT_CARDS,
  ...DEVIOUS_CARDS,
];

// Esta función simula "robar" una mano de 6 cartas.
const getRandomCards = (count) => {
  const shuffled = [...GAME_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getPlayingHand = (handData) => {
  // Mapea IDs a assets; si no existe, usa un fallback para no perder el conteo
  return handData.map((card) => {
    const found = GAME_CARDS.find((gameCard) => gameCard.id === card.id);
    if (found) return found;
    // Fallback seguro: mantener el id para la lógica y usar dorso de carta
    return { id: card.id, url: '01-card_back.png' };
  });
}

const getDraftCards = (draftData) => {
  return draftData.map((card) => {
    const found = GAME_CARDS.find((gameCard) => gameCard.id === card.id);
    return found || { id: card.id, url: '01-card_back.png' };
  });
}

const getSecretCards = (secretData) => {
  return secretData.map((card) => {
    const found = SECRET_CARDS.find((secretCard) => secretCard.id === card.id);
    return found || { id: card.id, url: '05-secret_back.png' };
  });
};

const getRandomDetectives = (count) => {
  const shuffled = [...DETECTIVE_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getEventCardData = (cardId) => {
  const card = EVENT_CARDS.find((gameCard) => gameCard.id == cardId);
  return card
}

const getCardImageUrl = (cardId) => {
  const card = GAME_CARDS.find(c => c.id === cardId);
  // Devuelve la URL si existe, sino un fallback
  return card ? card.url : '01-card_back.png';
}



export const cardService = {
  getRandomCards,
  getPlayingHand,
  getSecretCards,
  getRandomDetectives,
  getDraftCards,
  getEventCardData,
  getCardImageUrl
};