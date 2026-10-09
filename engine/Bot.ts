import { GameState } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT, CONTROLS } from '../constants';
import { UpgradeOption } from './Progression';

/**
 * Cerveau du bot de test, partagé par les tests headless (tests/bot.ts) et le mode bot
 * du navigateur (dev : window.__SI.bot()).
 * Stratégie de joueur moyen : ramasse l'XP et le butin en priorité (tas les plus rentables),
 * esquive les ennemis au contact et les tirs, reste loin des bords, évite le trou noir,
 * dash quand il est encerclé. Tir et visée automatiques.
 */

export interface BotDecision {
  /** Direction de déplacement normalisée (ou 0,0). */
  move: { x: number; y: number };
  /** Touches de compétence à presser ce pas. */
  keys: Set<string>;
}

const THREAT_RANGE = 300;
const BULLET_RANGE = 220;
const XP_RANGE = 1000;

export const botThink = (s: GameState): BotDecision => {
  const p = s.player;
  let mx = 0, my = 0;
  let nearCount = 0;
  // Fuit seulement les ennemis proches (poussée forte au contact, nulle à THREAT_RANGE)
  for (const e of s.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > THREAT_RANGE * THREAT_RANGE) continue;
    const d = Math.sqrt(d2) || 1;
    const w = (e.type === 'boss' ? 3 : 1) * 3 * (1 - d / THREAT_RANGE) ** 2 * (THREAT_RANGE / Math.max(d, 60));
    mx += (dx / d) * w; my += (dy / d) * w;
    if (d < 180) nearCount++;
  }
  // Projectiles ennemis proches
  for (const pr of s.projectiles) {
    if (pr.ownerId === 'player') continue;
    const dx = p.x - pr.x, dy = p.y - pr.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > BULLET_RANGE * BULLET_RANGE) continue;
    const d = Math.sqrt(d2) || 1;
    mx += (dx / d) * 1.5; my += (dy / d) * 1.5;
  }
  // Ramasse l'XP comme un joueur : va vers les tas les plus rentables (valeur / distance)
  let ax = 0, ay = 0;
  for (const x of s.xpDrops) {
    const dx = x.x - p.x, dy = x.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > XP_RANGE * XP_RANGE) continue;
    const d = Math.sqrt(d2) || 1;
    const w = x.amount / (d + 80);
    ax += (dx / d) * w; ay += (dy / d) * w;
  }
  // Butin (soins, trou de ver) : aussi recherché
  for (const pk of s.pickups) {
    const dx = pk.x - p.x, dy = pk.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < XP_RANGE) { ax += (dx / d) * 40 / (d + 80); ay += (dy / d) * 40 / (d + 80); }
  }
  const al = Math.hypot(ax, ay);
  if (al > 0) { mx += (ax / al) * 1.6; my += (ay / al) * 1.6; }
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
  const keys = new Set<string>();
  if (nearCount >= 3) keys.add(CONTROLS.ABILITY_1);
  if (nearCount >= 2) keys.add(CONTROLS.ABILITY_2);
  return { move: len > 0.2 ? { x: mx / len, y: my / len } : { x: 0, y: 0 }, keys };
};

/** Choix d'amélioration du bot : le premier ou au hasard. */
export const botPickUpgrade = (opts: UpgradeOption[], pick: 'first' | 'random' = 'random'): UpgradeOption | undefined =>
  pick === 'first' ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
