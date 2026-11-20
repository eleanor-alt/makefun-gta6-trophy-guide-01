// Progress store: earned trophies and the spoiler setting, kept in the browser's
// localStorage and exportable to a file / importable back. No network, no cookies.
export const STORE_KEY = 'leonida-ledger-v1';

export function defaultState() {
  return { earned: [], spoilers: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.earned)) return defaultState();
    return {
      earned: parsed.earned.filter((id) => typeof id === 'string'),
      spoilers: parsed.spoilers !== false,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: state.earned, spoilers: state.spoilers }));
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function toggleEarned(state, trophyId) {
  if (isEarned(state, trophyId)) {
    state.earned = state.earned.filter((id) => id !== trophyId);
  } else {
    state.earned = [...state.earned, trophyId];
  }
  saveState(state);
  return state;
}

export function exportProgress(state) {
  const blob = new Blob([JSON.stringify({ app: 'leonida-ledger', earned: state.earned }, null, 2)], {
    type: 'application/json',
  });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'leonida-ledger-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export async function importProgress(file, knownIds) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) throw new Error('That file holds no trophy list.');
  const known = new Set(knownIds);
  return list.filter((id) => typeof id === 'string' && known.has(id));
}

export function resetProgress() {
  localStorage.removeItem(STORE_KEY);
  return defaultState();
}
