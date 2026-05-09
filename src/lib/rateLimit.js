const STORAGE_KEY = 'rl_attempts';
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const loadAttempts = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveAttempts = (map) => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map)); }
  catch { /* quota exceeded */ }
};

export const checkRateLimit = email => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const map = loadAttempts();
  const history = (map[key] || []).filter(t => now - t < WINDOW_MS);
  if (history.length >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((history[0] + WINDOW_MS - now) / 1000) };
  }
  return { allowed: true };
};

export const recordAttempt = email => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const map = loadAttempts();
  const history = (map[key] || []).filter(t => now - t < WINDOW_MS);
  history.push(now);
  map[key] = history;
  saveAttempts(map);
};

export const clearAttempts = email => {
  const map = loadAttempts();
  delete map[email.toLowerCase().trim()];
  saveAttempts(map);
};
