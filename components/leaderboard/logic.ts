import type { LeaderboardResponse, ScoreRow, ScoreSubmission } from '../../types';
import { LEADERBOARD_TEXT as T } from './text';

/** Parties pures du classement (testées dans tests/leaderboard.test.ts). */

/** Rang en français : 1er, 2e, 37e. */
export const ordinal = (rank: number): string => (rank === 1 ? '1er' : `${rank}e`);

/** « Tu es 37e sur 120 », ou null si le rang est inconnu. */
export const rankMessage = (me: ScoreRow | null | undefined, total: number): string | null =>
  me && me.rank > 0 ? T.yourRank(me.rank, Math.max(total, me.rank), ordinal(me.rank)) : null;

/** Durée mm:ss (h:mm:ss au-delà d'une heure). */
export const formatDuration = (sec: number): string => {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const formatScore = (n: number): string => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');

/** Le joueur figure-t-il dans le top affiché ? (sinon on affiche sa ligne à part) */
export const meInTop = (r: LeaderboardResponse): boolean => r.top.some(row => row.me);

/** Ligne du joueur à afficher sous le top : seulement s'il est hors top 10. */
export const meOutsideTop = (r: LeaderboardResponse): ScoreRow | null =>
  r.me && !meInTop(r) && !r.top.some(row => row.rank === r.me!.rank && row.name === r.me!.name) ? r.me : null;

export interface RunInfo {
  score: number; wave: number; level: number; time: number; totalKills: number; shipId: string;
}

/** Entiers ≥ 0 ; temps de jeu (ms de simulation) → secondes. */
export const buildSubmission = (
  player: { id: string; name: string }, run: RunInfo, build: string,
): ScoreSubmission => {
  const int = (v: number) => Math.max(0, Math.round(Number.isFinite(v) ? v : 0));
  return {
    playerId: player.id, name: player.name,
    score: int(run.score), wave: int(run.wave), level: int(run.level),
    timeSec: int(run.time / 1000), kills: int(run.totalKills),
    ship: run.shipId, build, website: '',
  };
};
