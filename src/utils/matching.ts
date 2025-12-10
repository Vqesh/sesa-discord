/**
 * Generates a derangement - a permutation where no element appears in its original position
 * This ensures no one gets themselves as their Secret Santa match
 */
export function assignMatches(participants: string[]): { [giverId: string]: string } {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants');
  }

  const shuffled = [...participants];
  let isValid = false;

  // Keep shuffling until we get a valid derangement
  while (!isValid) {
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Check if it's a valid derangement (no one got themselves)
    isValid = participants.every((person, index) => person !== shuffled[index]);
  }

  // Create matches: each person gives to the next person in the shuffled array
  const matches: { [giverId: string]: string } = {};

  for (let i = 0; i < participants.length; i++) {
    const giver = participants[i];
    const receiver = shuffled[i];
    matches[giver] = receiver;
  }

  return matches;
}
