import { GameState } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

/**
 * Limites de l'arène = le cadre bleu, celles du joueur. Règle : rien de jouable ne se trouve
 * dehors (ennemis, boss, XP, butin, mines, drones, zones, événements). Seuls les projectiles
 * en vol peuvent sortir (ils disparaissent) ; le rendu découpe aussi tout ce qui dépasse.
 */
export const ARENA = { minX: 0, minY: 0, maxX: WORLD_WIDTH, maxY: WORLD_HEIGHT };

/** Rayons de bornage des objets sans `radius` propre. */
export const ARENA_RADIUS = { xp: 6, pickup: 18, mine: 12, drone: 10 };

const clampAxis = (v: number, min: number, max: number) => (min > max ? (min + max) / 2 : Math.max(min, Math.min(max, v)));

/** Vrai si un cercle (centre, rayon) est entièrement dans l'arène. */
export const insideArena = (p: { x: number; y: number }, radius = 0) =>
  p.x - radius >= ARENA.minX && p.x + radius <= ARENA.maxX && p.y - radius >= ARENA.minY && p.y + radius <= ARENA.maxY;

/**
 * Ramène un cercle entièrement dans l'arène (modifie `p`). Annule la vitesse vers l'extérieur
 * (vx/vy, recul kx/ky) sur l'axe bloqué. Renvoie vrai si la position a été corrigée.
 */
export const clampToArena = (
  p: { x: number; y: number; vx?: number; vy?: number; kx?: number; ky?: number },
  radius = 0,
): boolean => {
  const x = clampAxis(p.x, ARENA.minX + radius, ARENA.maxX - radius);
  const y = clampAxis(p.y, ARENA.minY + radius, ARENA.maxY - radius);
  if (x === p.x && y === p.y) return false;
  if (x !== p.x) { if (p.vx !== undefined) p.vx = 0; if (p.kx !== undefined) p.kx = 0; }
  if (y !== p.y) { if (p.vy !== undefined) p.vy = 0; if (p.ky !== undefined) p.ky = 0; }
  p.x = x; p.y = y;
  return true;
};

/**
 * Point d'apparition à `distance` de `origin`, dans l'arène (rayon compris) : essaie plusieurs
 * directions au hasard, garde la première entièrement à l'intérieur ; sinon la plus lointaine bornée.
 */
export const spawnPointInArena = (origin: { x: number; y: number }, distance: number, radius: number, rand = Math.random) => {
  let best = { x: origin.x, y: origin.y }, bestD = -1;
  // (distance ≤ moitié de l'arène : il existe toujours une direction libre)
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2;
    const p = { x: origin.x + Math.cos(a) * distance, y: origin.y + Math.sin(a) * distance };
    if (insideArena(p, radius)) return p;
    clampToArena(p, radius);
    const d = Math.hypot(p.x - origin.x, p.y - origin.y);
    if (d > bestD) { best = p; bestD = d; }
  }
  return best;
};

/** Borne tout ce qui doit rester dans l'arène. Appelé à la fin de chaque pas de simulation. */
export const keepInArena = (state: GameState) => {
  clampToArena(state.player, state.player.radius);
  for (const e of state.enemies) clampToArena(e, e.radius);
  for (const d of state.xpDrops) clampToArena(d, ARENA_RADIUS.xp);
  for (const p of state.pickups) clampToArena(p, ARENA_RADIUS.pickup);
  for (const d of state.drones) clampToArena(d, ARENA_RADIUS.drone);
  for (const z of state.zones) clampToArena(z); // centre dedans ; le rendu découpe le cercle au cadre
  for (const p of state.projectiles) if (p.kind === 'mine') clampToArena(p, ARENA_RADIUS.mine);
  for (const ev of state.activeEvents) if (ev.started && (ev.x || ev.y)) clampToArena(ev);
};
