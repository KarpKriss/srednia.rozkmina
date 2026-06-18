const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoomCode(length = 4) {
  const chars = [];

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    chars.push(ALPHABET[randomIndex]);
  }

  return chars.join('');
}
