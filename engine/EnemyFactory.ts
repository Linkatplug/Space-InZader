import { Entity, Stats } from '../types';
import { INITIAL_STATS, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { ENEMIES, difficultyForWave, pickEnemyType } from '../data/enemies';
import { uid } from './ids';

/**
 * Crée un ennemi à partir de sa définition (data/enemies.ts).
 * @param origin  point autour duquel il apparaît (le joueur en général)
 * @param forcedType  id d'ennemi imposé ; sinon tirage pondéré selon la vague
 * @param customDist  distance d'apparition ; sinon 1000–1200
 */
export const spawnEnemy = (
  wave: number,
  origin: { x: number; y: number },
  forcedType?: string,
  customDist?: number,
): Entity => {
  const type = forcedType && ENEMIES[forcedType] ? forcedType : pickEnemyType(wave, Math.random());
  const def = ENEMIES[type];
  const angle = Math.random() * Math.PI * 2;
  const distance = customDist ?? (1000 + Math.random() * 200);
  // Les ennemis apparaissent dans les limites du monde (marge) pour ne pas rester coincés dehors
  const margin = 50;
  const x = Math.max(-margin, Math.min(WORLD_WIDTH + margin, origin.x + Math.cos(angle) * distance));
  const y = Math.max(-margin, Math.min(WORLD_HEIGHT + margin, origin.y + Math.sin(angle) * distance));

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

  return {
    id: uid('en'),
    x, y, vx: 0, vy: 0, rotation: 0,
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
