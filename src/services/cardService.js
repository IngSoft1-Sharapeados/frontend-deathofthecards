const HELP_CARDS = [
  '00-help.png',
];

const BACK_CARDS = [
  '01-card_back.png',
  '05-secret_front.png',
  '06-secret_back.png',
];

const MURDER_SECRET_CARDS = [
  '02-murder_escapes.png',
  '03-secret_murderer.png',
  '04-secret_accomplice.png',
];

const DETECTIVE_CARDS = [
  '07-detective_poirot.png',
  '08-detective_marple.png',
  '09-detective_satterthwaite.png',
  '10-detective_pyne.png',
  '11-detective_brent.png',
  '12-detective_tommyberesford.png',
  '13-detective_tuppenceberesford.png',
  '14-detective_quin.png',
  '15-detective_oliver.png',
];

const INSTANT_CARDS = [
  '16-Instant_notsofast.png',
];

const EVENT_CARDS = [
  '17-event_cardsonthetable.png',
  '18-event_anothervictim.png',
  '19-event_deadcardfolly.png',
  '20-event_lookashes.png',
  '21-event_cardtrade.png',
  '22-event_onemore.png',
  '23-event_delayescape.png',
  '24-event_earlytrain.png',
  '25-event_pointsuspicions.png',
];

const DEVIOUS_CARDS = [
  '26-devious_blackmailed.png',
  '27-devious_fauxpas.png',
];


const GAME_CARDS = [
  ...DETECTIVE_CARDS,
  ...INSTANT_CARDS,
  ...EVENT_CARDS,
  ...DEVIOUS_CARDS,
];

// Esta función simula "robar" una mano de 6 cartas.
const getRandomHand = () => {
  const shuffled = [...GAME_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
};

export const cardService = {
  getRandomHand,
};