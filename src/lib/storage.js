const PLAYER_KEY = 'srednia-rozkmina-player-id';

export function getOrCreateLocalPlayerId() {
  const existing = window.localStorage.getItem(PLAYER_KEY);

  if (existing) {
    return existing;
  }

  const id = createSafeId();
  window.localStorage.setItem(PLAYER_KEY, id);
  return id;
}

export function createSafeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
