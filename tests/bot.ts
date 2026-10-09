import { GameState } from '../types';
import { createInitialState } from '../engine/GameFactory';
import { updateGameState } from '../engine/CoreEngine';
import { applyUpgrade, rollUpgradeOptions } from '../engine/Progression';
import { botThink, botPickUpgrade } from '../engine/Bot';
import { STEP } from './helpers';

/**
 * Bot de test : joue une partie complète sans navigateur.
 * Le cerveau du bot est dans engine/Bot.ts (aussi utilisable en navigateur : window.__SI.bot()).
 * Sert à l'équilibrage (scripts/balance) et aux tests de non-régression.
 */

export interface BotResult {
  shipId: string;
  survivedSec: number;
  died: boolean;
  wave: number;
  level: number;
  kills: number;
  score: number;
  damageDealt: number;
  damageTaken: number;
  weapons: string[];
  damageBySource: Record<string, number>;
  /** Instant (s) de chaque montée de niveau. */
  levelTimes: number[];
}

export const playBotGame = (shipId: string, maxSeconds = 600, pick: 'first' | 'random' = 'random'): BotResult => {
  const s = createInitialState(shipId);
  s.status = 'playing';
  s.autoFire = true;
  s.autoAim = true;
  let died = false;
  const levelTimes: number[] = [];
  const frames = Math.round(maxSeconds / STEP);
  for (let i = 0; i < frames && !died; i++) {
    const { move, keys } = botThink(s);
    s.analogMove = move;
    updateGameState(s, STEP, keys, { x: s.player.x + 1, y: s.player.y },
      () => {
        levelTimes.push(s.time / 1000);
        const o = botPickUpgrade(rollUpgradeOptions(s), pick);
        if (o) applyUpgrade(s, o); else s.experience = 0;
      },
      () => { died = true; });
  }
  return {
    shipId,
    survivedSec: Math.round(s.time / 1000),
    died,
    wave: s.wave,
    level: s.level,
    kills: s.totalKills,
    score: s.score,
    damageDealt: Math.round(s.damageDealt),
    damageTaken: Math.round(s.damageTaken),
    weapons: s.activeWeapons.map(w => `${w.id}:${w.level}`),
    damageBySource: s.damageBySource,
    levelTimes,
  };
};
