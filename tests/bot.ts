import { GameState } from '../types';
import { createInitialState } from '../engine/GameFactory';
import { updateGameState } from '../engine/CoreEngine';
import { applyUpgrade, rollUpgradeOptions } from '../engine/Progression';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { STEP } from './helpers';

/**
 * Bot de test : joue une partie complète sans navigateur.
 * Stratégie simple : fuit les ennemis proches (somme des répulsions), va chercher l'XP,
 * reste loin des bords, tir et visée automatiques, dash quand il est encerclé.
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
}

const botMove = (s: GameState) => {
  const p = s.player;
  let mx = 0, my = 0;
  let nearCount = 0;
  for (const e of s.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 450 * 450) continue;
    const d = Math.sqrt(d2) || 1;
    const w = (e.type === 'boss' ? 3 : 1) * (450 / d);
    mx += (dx / d) * w; my += (dy / d) * w;
    if (d < 180) nearCount++;
  }
  // Projectiles ennemis proches
  for (const pr of s.projectiles) {
    if (pr.ownerId === 'player') continue;
    const dx = p.x - pr.x, dy = p.y - pr.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 250 * 250) continue;
    const d = Math.sqrt(d2) || 1;
    mx += (dx / d) * 1.5; my += (dy / d) * 1.5;
  }
  // Attraction vers l'XP la plus proche si pas de menace forte
  if (Math.hypot(mx, my) < 1.5) {
    let best = null as null | { x: number; y: number }, bd = Infinity;
    for (const x of s.xpDrops) {
      const d = (x.x - p.x) ** 2 + (x.y - p.y) ** 2;
      if (d < bd) { bd = d; best = x; }
    }
    if (best) { const d = Math.sqrt(bd) || 1; mx += ((best.x - p.x) / d) * 1.2; my += ((best.y - p.y) / d) * 1.2; }
  }
  // Évite les bords du monde
  const margin = 400;
  if (p.x < margin) mx += 2; if (p.x > WORLD_WIDTH - margin) mx -= 2;
  if (p.y < margin) my += 2; if (p.y > WORLD_HEIGHT - margin) my -= 2;
  // Évite le trou noir
  for (const ev of s.activeEvents) {
    if (ev.type === 'BLACK_HOLE' && ev.started) {
      const dx = p.x - ev.x, dy = p.y - ev.y; const d = Math.hypot(dx, dy) || 1;
      if (d < 1000) { mx += (dx / d) * 4; my += (dy / d) * 4; }
    }
  }
  const len = Math.hypot(mx, my);
  s.analogMove = len > 0.2 ? { x: mx / len, y: my / len } : { x: 0, y: 0 };
  return nearCount;
};

export const playBotGame = (shipId: string, maxSeconds = 600, pick: 'first' | 'random' = 'random'): BotResult => {
  const s = createInitialState(shipId);
  s.status = 'playing';
  s.autoFire = true;
  s.autoAim = true;
  let died = false;
  const frames = Math.round(maxSeconds / STEP);
  for (let i = 0; i < frames && !died; i++) {
    const crowded = botMove(s);
    const keys = new Set<string>();
    if (crowded >= 3) keys.add('shift');
    if (crowded >= 2) keys.add('e');
    updateGameState(s, STEP, keys, { x: s.player.x + 1, y: s.player.y },
      () => {
        const opts = rollUpgradeOptions(s);
        const o = pick === 'first' ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
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
  };
};
