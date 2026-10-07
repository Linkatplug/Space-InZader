import { GameState, ShipClass } from '../types';
import { SHIPS } from '../data/ships';

/**
 * Méta-progression : records, statistiques cumulées, déblocage des vaisseaux.
 * Persistée dans localStorage (si disponible). Les fonctions pures prennent/rendent
 * un objet MetaSave → testables sans navigateur.
 */

export const SAVE_KEY = 'space-inzader-save-v2';

export interface RunRecord {
  date: number;
  shipId: string;
  wave: number;
  kills: number;
  score: number;
  level: number;
  durationSec: number;
}

export interface MetaSave {
  version: 2;
  bestScore: number;
  bestWave: number;
  totalKills: number;
  totalRuns: number;
  totalPlaySec: number;
  bossKills: number;
  lastShipId?: string;
  history: RunRecord[];   // 10 dernières parties, la plus récente en premier
  settings: { muted: boolean; autoFire: boolean };
}

export const emptySave = (): MetaSave => ({
  version: 2, bestScore: 0, bestWave: 0, totalKills: 0, totalRuns: 0, totalPlaySec: 0, bossKills: 0,
  history: [], settings: { muted: false, autoFire: false },
});

const storage = (): Storage | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
};

export const loadSave = (): MetaSave => {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const data = JSON.parse(raw);
    // Fusion avec les valeurs par défaut : tolère les sauvegardes d'anciennes versions
    return { ...emptySave(), ...data, settings: { ...emptySave().settings, ...(data.settings ?? {}) } };
  } catch {
    return emptySave();
  }
};

export const writeSave = (save: MetaSave) => {
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* stockage plein ou bloqué : on ignore */
  }
};

export const isShipUnlocked = (ship: ShipClass, save: MetaSave) => {
  if (!ship.unlock) return true;
  if (ship.unlock.type === 'wave') return save.bestWave >= ship.unlock.wave;
  return save.totalKills >= ship.unlock.kills;
};

export const unlockLabel = (ship: ShipClass) => {
  if (!ship.unlock) return '';
  return ship.unlock.type === 'wave' ? `Atteindre la vague ${ship.unlock.wave}` : `${ship.unlock.kills} éliminations au total`;
};

export interface RunSummary {
  record: RunRecord;
  newBestScore: boolean;
  newBestWave: boolean;
  unlockedShips: ShipClass[];
}

/** Enregistre une partie terminée. Pur : renvoie la nouvelle sauvegarde et le résumé. */
export const recordRun = (save: MetaSave, state: GameState, now = Date.now()): { save: MetaSave; summary: RunSummary } => {
  const record: RunRecord = {
    date: now,
    shipId: state.shipId,
    wave: state.wave,
    kills: state.totalKills,
    score: state.score,
    level: state.level,
    durationSec: Math.round(state.time / 1000),
  };
  const lockedBefore = SHIPS.filter(s => !isShipUnlocked(s, save));
  const next: MetaSave = {
    ...save,
    bestScore: Math.max(save.bestScore, record.score),
    bestWave: Math.max(save.bestWave, record.wave),
    totalKills: save.totalKills + record.kills,
    totalRuns: save.totalRuns + 1,
    totalPlaySec: save.totalPlaySec + record.durationSec,
    bossKills: save.bossKills + state.bossKills,
    lastShipId: state.shipId,
    history: [record, ...save.history].slice(0, 10),
  };
  return {
    save: next,
    summary: {
      record,
      newBestScore: record.score > save.bestScore,
      newBestWave: record.wave > save.bestWave,
      unlockedShips: lockedBefore.filter(s => isShipUnlocked(s, next)),
    },
  };
};
