// Space InZader — classement en ligne + journal des parties + erreurs JS (module du serveur d'avis).
// Node pur, aucune dépendance. Fichiers dans le dossier de données (volume Docker) :
//   scores.json   meilleur score par joueur (playerId), écriture atomique (temporaire + rename)
//   runs.jsonl    une ligne par partie terminée (statistiques), archivé au-delà de 10 Mo
//   errors.jsonl  erreurs JavaScript remontées par le jeu
//   archive/      scores-retires.jsonl (tricheurs retirés), runs-<date>.jsonl… — jamais de suppression
// Aucune adresse IP n'est écrite.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export const SCORE_LIMITS = {
  body: 8 * 1024,
  perHour: 30,
  errorsPerHour: 20,
  maxPlayers: 5000,
  score: 50_000_000,
  wave: 999,
  level: 999,
  timeSec: 6 * 3600,
  kills: 1_000_000,
  runsFile: 10 * 1024 * 1024,
  errorsFile: 5 * 1024 * 1024,
  topMax: 50,
};

const DEVICES = ['ordinateur', 'telephone'];
const INPUTS = ['clavier', 'tactile', 'manette'];
const ENDS = ['mort', 'abandon'];

// ---------------------------------------------------------------------------
// Validation (pur)
// ---------------------------------------------------------------------------

/** Texte court sur une ligne : caractères de contrôle retirés, espaces normalisés. */
export const cleanText = (v, max) => String(v ?? '')
  .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

/** Pseudo : 2–16 caractères, sinon « Pilote ». */
export const cleanName = (v) => {
  const n = cleanText(v, 16).trim();
  return n.length >= 2 ? n : 'Pilote';
};

const isInt = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
const ident = (v, max = 32) => (typeof v === 'string' && /^[A-Za-z0-9_\-:.]+$/.test(v) ? v.slice(0, max) : null);

/**
 * Valide un score envoyé en fin de partie.
 * → { status: 201, sub } | { status: 201, bot: true } (piège rempli) | { status: 400, error }
 */
export const validateScore = (b) => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { status: 400, error: 'invalide' };
  if (typeof b.website === 'string' && b.website.trim() !== '') return { status: 201, bot: true };
  const L = SCORE_LIMITS;
  const playerId = typeof b.playerId === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(b.playerId) ? b.playerId : null;
  if (!playerId) return { status: 400, error: 'joueur invalide' };
  if (!isInt(b.score, L.score) || !isInt(b.wave, L.wave) || !isInt(b.level, L.level)
    || !isInt(b.timeSec, L.timeSec) || !isInt(b.kills, L.kills)) return { status: 400, error: 'valeurs invalides' };
  if (b.wave < 1 || b.level < 1) return { status: 400, error: 'valeurs invalides' };
  // Cohérence grossière : pas plus de 30 éliminations par seconde de jeu
  if (b.kills > (b.timeSec + 5) * 30) return { status: 400, error: 'valeurs incohérentes' };
  const ship = ident(b.ship);
  if (!ship) return { status: 400, error: 'vaisseau invalide' };

  const sub = {
    playerId, name: cleanName(b.name), score: b.score, wave: b.wave, level: b.level,
    timeSec: b.timeSec, kills: b.kills, ship, build: cleanText(b.build, 30) || '?',
  };
  if (DEVICES.includes(b.device)) sub.device = b.device;
  if (INPUTS.includes(b.input)) sub.input = b.input;
  if (ENDS.includes(b.end)) sub.end = b.end;
  if (b.lastHitBy === null || typeof b.lastHitBy === 'string') sub.lastHitBy = b.lastHitBy ? cleanText(b.lastHitBy, 32) : null;
  if (Array.isArray(b.weapons)) {
    sub.weapons = b.weapons.slice(0, 8)
      .filter(w => w && ident(w.id) && Number.isInteger(w.level) && w.level >= 1 && w.level <= 20)
      .map(w => ({ id: ident(w.id), level: w.level }));
  }
  if (Array.isArray(b.keystones)) sub.keystones = b.keystones.slice(0, 12).map(k => ident(k)).filter(Boolean);
  if (Array.isArray(b.levelTimes)) {
    sub.levelTimes = b.levelTimes.slice(0, 200).filter(t => typeof t === 'number' && Number.isFinite(t) && t >= 0 && t <= L.timeSec).map(t => Math.round(t));
  }
  if (Array.isArray(b.topDamage)) {
    sub.topDamage = b.topDamage.slice(0, 5)
      .filter(d => d && ident(d.source) && typeof d.dmg === 'number' && Number.isFinite(d.dmg) && d.dmg >= 0)
      .map(d => ({ source: ident(d.source), dmg: Math.round(d.dmg) }));
  }
  return { status: 201, sub };
};

/** Valide une erreur JavaScript remontée par le jeu. → { status, err? } */
export const validateError = (b) => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { status: 400, error: 'invalide' };
  const message = cleanText(b.message, 300);
  if (!message) return { status: 400, error: 'message vide' };
  return {
    status: 201,
    err: {
      message,
      source: cleanText(b.source, 200),
      line: Number.isInteger(b.line) && b.line >= 0 ? b.line : null,
      build: cleanText(b.build, 30) || '?',
      browser: cleanText(b.browser ?? b.ua, 160),
    },
  };
};

// ---------------------------------------------------------------------------
// Classement (pur)
// ---------------------------------------------------------------------------

/** Classement vide. Format de scores.json : { players: { [playerId]: entrée } }. */
export const emptyBoard = () => ({ players: {} });

const byScore = ([, a], [, b]) => b.score - a.score || a.date.localeCompare(b.date);

/**
 * Ajoute un score : 1 ligne par joueur (son meilleur score), pseudo = dernier utilisé.
 * Au-delà de maxPlayers, on garde les meilleurs. → { board, personalBest }
 */
export const addScore = (board, sub, isoDate, maxPlayers = SCORE_LIMITS.maxPlayers) => {
  const players = { ...board.players };
  const prev = players[sub.playerId];
  const personalBest = !prev || sub.score > prev.score;
  const best = personalBest
    ? { name: sub.name, score: sub.score, wave: sub.wave, level: sub.level, timeSec: sub.timeSec, kills: sub.kills, ship: sub.ship, build: sub.build, date: isoDate }
    : { ...prev, name: sub.name };
  players[sub.playerId] = best;
  const ids = Object.keys(players);
  if (ids.length > maxPlayers) {
    const keep = Object.entries(players).sort(byScore).slice(0, maxPlayers);
    return { board: { players: Object.fromEntries(keep) }, personalBest };
  }
  return { board: { players }, personalBest };
};

const toRow = (rank, e, me) => ({
  rank, name: e.name, score: e.score, wave: e.wave, timeSec: e.timeSec, ship: e.ship, date: e.date, ...(me ? { me: true } : {}),
});

/** Réponse de classement : top `limit` + ligne du joueur (rang) + total. */
export const leaderboard = (board, playerId = '', limit = 10) => {
  const sorted = Object.entries(board.players).sort(byScore);
  const n = Math.max(1, Math.min(SCORE_LIMITS.topMax, Math.floor(limit) || 10));
  const top = sorted.slice(0, n).map(([id, e], i) => toRow(i + 1, e, id === playerId));
  const idx = playerId ? sorted.findIndex(([id]) => id === playerId) : -1;
  return { top, me: idx >= 0 ? toRow(idx + 1, sorted[idx][1], true) : null, total: sorted.length };
};

/** Retire un joueur du classement (tricheur). → { board, removed } (removed = entrée retirée ou null) */
export const removePlayer = (board, playerId) => {
  const removed = board.players[playerId] ?? null;
  if (!removed) return { board, removed: null };
  const players = { ...board.players };
  delete players[playerId];
  return { board: { players }, removed };
};

// ---------------------------------------------------------------------------
// Stockage
// ---------------------------------------------------------------------------

const exists = async (f) => { try { await fs.access(f); return true; } catch { return false; } };
const sizeOf = async (f) => { try { return (await fs.stat(f)).size; } catch { return 0; } };

/** Écriture atomique : fichier temporaire puis renommage. */
export const writeJsonAtomic = async (file, data) => {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data), 'utf8');
  await fs.rename(tmp, file);
};

/** Lit un fichier JSON Lines (lignes invalides ignorées). */
export const readJsonl = async (file) => {
  let text = '';
  try { text = await fs.readFile(file, 'utf8'); } catch { return []; }
  const out = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* ligne abîmée : ignorée */ }
  }
  return out;
};

const stamp = (iso) => iso.slice(0, 19).replace(/:/g, '-');

/**
 * Magasin de scores pour un dossier de données. Les écritures passent par une file
 * (une à la fois) pour éviter les courses entre requêtes simultanées.
 */
export const createScoreStore = (dataDir, now = () => Date.now()) => {
  const files = {
    scores: path.join(dataDir, 'scores.json'),
    runs: path.join(dataDir, 'runs.jsonl'),
    errors: path.join(dataDir, 'errors.jsonl'),
    archive: path.join(dataDir, 'archive'),
  };
  let queue = Promise.resolve();
  const serial = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };
  const iso = () => new Date(now()).toISOString();

  const loadBoard = async () => {
    try {
      const b = JSON.parse(await fs.readFile(files.scores, 'utf8'));
      return b && typeof b.players === 'object' && b.players ? b : emptyBoard();
    } catch { return emptyBoard(); }
  };

  /** Ajoute une ligne à un journal ; au-delà de `max` octets, l'ancien est archivé d'abord. */
  const appendLog = async (file, obj, max, archivePrefix) => {
    const line = JSON.stringify(obj) + '\n';
    await fs.mkdir(dataDir, { recursive: true });
    if (await sizeOf(file) + Buffer.byteLength(line) > max) {
      await fs.mkdir(files.archive, { recursive: true });
      let target = path.join(files.archive, `${archivePrefix}-${stamp(iso())}.jsonl`);
      for (let i = 2; await exists(target); i++) target = path.join(files.archive, `${archivePrefix}-${stamp(iso())}-${i}.jsonl`);
      await fs.rename(file, target);
    }
    await fs.appendFile(file, line, 'utf8');
  };

  return {
    files,
    loadBoard,
    /** Enregistre une partie : journal runs.jsonl + meilleur score. → LeaderboardResponse */
    submit: (sub) => serial(async () => {
      const date = iso();
      await appendLog(files.runs, { date, ...sub }, SCORE_LIMITS.runsFile, 'runs');
      const { board, personalBest } = addScore(await loadBoard(), sub, date);
      await writeJsonAtomic(files.scores, board);
      return { ...leaderboard(board, sub.playerId, 10), personalBest };
    }),
    get: async (playerId, limit) => leaderboard(await loadBoard(), playerId, limit),
    /** Retire un joueur : ligne archivée dans archive/scores-retires.jsonl. → vrai si retiré */
    remove: (playerId) => serial(async () => {
      const { board, removed } = removePlayer(await loadBoard(), playerId);
      if (!removed) return false;
      await fs.mkdir(files.archive, { recursive: true });
      await fs.appendFile(path.join(files.archive, 'scores-retires.jsonl'), JSON.stringify({ removedAt: iso(), playerId, ...removed }) + '\n', 'utf8');
      await writeJsonAtomic(files.scores, board);
      return true;
    }),
    logError: (err) => serial(() => appendLog(files.errors, { date: iso(), ...err }, SCORE_LIMITS.errorsFile, 'errors')),
    runs: () => readJsonl(files.runs),
    errors: () => readJsonl(files.errors),
  };
};
