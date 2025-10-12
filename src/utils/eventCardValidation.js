
const EVENT_IDS =  new Set([17, 18, 19, 20, 21, 22, 23,24,25]);

export function isValidEventCard(hand, selectedInstanceIds) {
  console.log("sdf");
  if (!Array.isArray(hand) || !Array.isArray(selectedInstanceIds)) return false;
  console.log(hand,selectedInstanceIds);
  if (selectedInstanceIds.length != 1) return false; 

  // Map selected instanceIds to card ids
  const selectedCards = selectedInstanceIds
    .map((iid) => hand.find((c) => c.instanceId === iid))
    .filter(Boolean);

  if (selectedCards.length !== selectedInstanceIds.length) return false; // missing cards

  if (selectedCards.some((c) => !EVENT_IDS.has(c.id))) return false;

  return true;
}

export default { isValidEventCard };
