import type { GameState, LeaderboardResponse, ScoreSubmission } from '../../types';
import { buildFeedbackSnapshot } from '../../engine/FeedbackSnapshot';
import { buildSubmission } from './logic';
import { LEADERBOARD_TEXT as T, LEADERBOARD_TOP } from './text';

export const SCORES_ENDPOINT = '/api/scores';

export type LeaderboardResult =
  | { ok: true; data: LeaderboardResponse }
  | { ok: false; message: string };

/** Message selon le code HTTP (0 = réseau injoignable). 404 / 502 / 503 / 504 : serveur absent. */
export const messageForStatus = (status: number): string => {
  switch (status) {
    case 400: return T.messages.invalid;
    case 413: return T.messages.tooBig;
    case 429: return T.messages.tooMany;
    case 0: case 404: case 500: case 502: case 503: case 504: return T.messages.unavailable;
    default: return T.messages.unknown;
  }
};

/** Vérifie la forme de la réponse (un serveur de dev qui renvoie du HTML ne doit pas casser l'écran). */
export const parseLeaderboard = (data: unknown): LeaderboardResponse | null => {
  const d = data as Partial<LeaderboardResponse> | null;
  if (!d || typeof d !== 'object' || !Array.isArray(d.top) || typeof d.total !== 'number') return null;
  return d as LeaderboardResponse;
};

const read = async (res: Response): Promise<LeaderboardResult> => {
  if (res.status !== 200 && res.status !== 201) return { ok: false, message: messageForStatus(res.status) };
  try {
    const data = parseLeaderboard(await res.json());
    return data ? { ok: true, data } : { ok: false, message: T.messages.unavailable };
  } catch {
    return { ok: false, message: T.messages.unavailable };
  }
};

/** Envoie le score de fin de partie ; la réponse contient le top 10 et la position du joueur. */
export const submitScore = async (sub: ScoreSubmission, fetchImpl: typeof fetch = fetch): Promise<LeaderboardResult> => {
  try {
    return await read(await fetchImpl(SCORES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    }));
  } catch {
    return { ok: false, message: messageForStatus(0) };
  }
};

/** Lit le classement (top + position du joueur) sans envoyer de score. */
export const fetchLeaderboard = async (
  playerId?: string, limit = LEADERBOARD_TOP, fetchImpl: typeof fetch = fetch,
): Promise<LeaderboardResult> => {
  const q = new URLSearchParams({ limit: String(limit) });
  if (playerId) q.set('playerId', playerId);
  try {
    return await read(await fetchImpl(`${SCORES_ENDPOINT}?${q}`));
  } catch {
    return { ok: false, message: messageForStatus(0) };
  }
};

export interface RunContext {
  device: 'ordinateur' | 'telephone';
  input: 'clavier' | 'tactile' | 'manette';
  end: 'mort' | 'abandon';
  build: string;
  /** secondes du passage de chaque niveau (index 0 = niveau 2), si l'état les garde */
  levelTimes?: number[];
}

const MAX_LEVEL_TIMES = 200;

/**
 * Soumission complète construite depuis l'état de fin de partie (pure) : champs du classement
 * + données de statistiques (arme, keystones, cause de mort, dégâts subis…). Listes bornées.
 */
export const buildRunSubmission = (
  state: GameState, player: { id: string; name: string }, ctx: RunContext,
): ScoreSubmission => {
  const snap = buildFeedbackSnapshot(state);
  const base = buildSubmission(player, {
    score: state.score, wave: state.wave, level: state.level, time: state.time,
    totalKills: state.totalKills, shipId: state.shipId,
  }, ctx.build);
  const sub: ScoreSubmission = {
    ...base,
    device: ctx.device, input: ctx.input, end: ctx.end,
    lastHitBy: snap.lastHitBy ?? null,
    weapons: (snap.weapons ?? []).slice(0, 8),
    keystones: (snap.keystones ?? []).slice(0, 20),
  };
  if (snap.topDamage?.length) sub.topDamage = snap.topDamage.slice(0, 5);
  const lt = (ctx.levelTimes ?? []).filter(Number.isFinite).slice(0, MAX_LEVEL_TIMES).map(t => Math.max(0, Math.round(t)));
  if (lt.length) sub.levelTimes = lt;
  return sub;
};
