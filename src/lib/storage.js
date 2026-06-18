const PLAYER_KEY = 'srednia-rozkmina-player-id';

export function getOrCreateLocalPlayerId() {
  const existing = window.localStorage.getItem(PLAYER_KEY);

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  window.localStorage.setItem(PLAYER_KEY, id);
  return id;
}
