import { Entity, Stats } from '../types';
import { INITIAL_STATS } from '../constants';
import { spawnPointInArena } from './Arena';
import { ENEMIES, WARP_IN, difficultyForWave, pickEnemyType } from '../data/enemies';
import { uid } from './ids';

/**
 * Crée un ennemi à partir de sa définition (data/enemies.ts).
 * @param origin  point autour duquel il apparaît (le joueur en général)
 * @param forcedType  id d'ennemi imposé ; sinon tirage pondéré selon la vague
 * @param customDist  distance d'apparition ; sinon 1000–1200
 * @param warp  arrivée en sortie d'hypervitesse (renforts, boss) ; pas pour les essaims/divisions
 */
export const spawnEnemy = (
  wave: number,
  origin: { x: number; y: number },
  forcedType?: string,
  customDist?: number,
  warp = false,
): Entity => {
  const type = forcedType && ENEMIES[forcedType] ? forcedType : pickEnemyType(wave, Math.random());
  const def = ENEMIES[type];
  const distance = Math.max(warp ? WARP_IN.minDist : 0, customDist ?? (1000 + Math.random() * 200));
  // Toujours entièrement dans l'arène (le cadre du joueur)
  const { x, y } = spawnPointInArena(origin, distance, def.radius);

  const difficulty = difficultyForWave(wave);
  // Les drones de base sont plus fragiles au tout début
  const earlyFactor = type === 'basic' && wave <= 2 ? 0.45 : 1.0;

  const base: Stats = {
    ...INITIAL_STATS,
    maxHull: def.hull * difficulty * earlyFactor,
    maxArmor: def.armor * difficulty,
    maxShield: def.shield * difficulty,
    armorHardness: def.armorHardness ?? 0,
    speed: def.speed,
    ...(def.resist ?? {}),
  };

  // Cap d'arrivée : vers le joueur (la traînée d'hypervitesse est dessinée derrière)
  const hx = origin.x - x, hy = origin.y - y;
  const hl = Math.hypot(hx, hy) || 1;
  const total = def.isBoss ? WARP_IN.bossDuration : WARP_IN.duration;

  return {
    id: uid('en'),
    x, y, vx: 0, vy: 0, rotation: Math.atan2(hy, hx),
    ...(warp ? { warpIn: { left: total, total, dirX: hx / hl, dirY: hy / hl, color: def.color, boss: !!def.isBoss } } : {}),
    radius: def.radius,
    type: def.isBoss ? 'boss' : 'enemy',
    subtype: type,
    baseStats: base,
    runtimeStats: base,
    modifiers: [],
    statsDirty: false,
    defense: { shield: base.maxShield, armor: base.maxArmor, hull: base.maxHull },
    lastFired: 0,
    marks: { type: 'resonance', count: 0 },
  };
};
