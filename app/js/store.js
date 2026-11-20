// Vice Ledger — progress store.
// Everything the tracker remembers lives in one object:
//   { earned: { <trophy slug>: true }, counts: { <trophy slug>: number }, spoilers: boolean }
// It is kept in the browser's localStorage so progress survives a reload, and
// it can be exported to a JSON file and imported back on another machine.
// Nothing here touches the network; if localStorage is unavailable (a locked
// down browser), the store quietly falls back to memory for the session.

const STORAGE_KEY = 'vice-ledger-progress-v1';

export function emptyProgress() {
  return { earned: {}, counts: {}, spoilers: true };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Keep only the parts of an imported or stored value that have the right shape. */
export function sanitizeProgress(value) {
  const clean = emptyProgress();
  if (!isPlainObject(value)) return clean;
  if (isPlainObject(value.earned)) {
    for (const [slug, flag] of Object.entries(value.earned)) if (flag === true) clean.earned[slug] = true;
  }
  if (isPlainObject(value.counts)) {
    for (const [slug, n] of Object.entries(value.counts)) {
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) clean.counts[slug] = Math.floor(n);
    }
  }
  if (typeof value.spoilers === 'boolean') clean.spoilers = value.spoilers;
  return clean;
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? emptyProgress() : sanitizeProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage denied: the in-memory copy still tracks this session.
  }
}

/** The file a player downloads from the Export button. */
export function exportFileText(progress) {
  return JSON.stringify({ app: 'vice-ledger', version: 1, progress }, null, 2);
}

/** Parse an imported file's text back into a progress object, or throw with a readable reason. */
export function parseImport(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isPlainObject(value) || !isPlainObject(value.progress)) {
    throw new Error('That file does not hold a Vice Ledger progress export.');
  }
  return sanitizeProgress(value.progress);
}
