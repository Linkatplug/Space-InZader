import { vi } from 'vitest';
import { GameState, Entity } from '../types';
import { createInitialState } from '../engine/GameFactory';
import { updateGameState } from '../engine/CoreEngine';
import { spawnEnemy } from '../engine/EnemyFactory';
import { WEAPONS } from '../data/weapons';
import { calculateRuntimeStats, syncDefenseState } from '../engine/StatsCalculator';

export const STEP = 1 / 60;

/** Remplace Math.random par un générateur déterministe (mulberry32). */
export const seedRandom = (seed = 42) => {
  let a = seed >>> 0;
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
};

/** État prêt à jouer, sans ennemis qui apparaissent seuls si `noSpawn`. */
export const makeState = (opts: { weaponIds?: string[]; noSpawn?: boolean; status?: GameState['status'] } = {}): GameState => {
  const s = createInitialState();
  s.status = opts.status ?? 'playing';
  if (opts.weaponIds) {
    s.activeWeapons = opts.weaponIds.map(id => {
      const w = WEAPONS.find(x => x.id === id);
      if (!w) throw new Error(`arme inconnue: ${id}`);
      return { ...w, level: 1, lastFired: -1e9 };
    });
  }
  if (opts.noSpawn) {
    s.spawnEnabled = false;
    s.waveQuota = 1e9; // pas de changement de vague pendant le test
  }
  s.player.runtimeStats = calculateRuntimeStats(s.player, s);
  syncDefenseState(s.player);
  s.player.statsDirty = false;
  return s;
};

export const addEnemy = (s: GameState, type: string, dx: number, dy = 0): Entity => {
  const e = spawnEnemy(s.wave, s.player, type, 0);
  e.x = s.player.x + dx;
  e.y = s.player.y + dy;
  s.enemies.push(e);
  return e;
};

export interface StepOptions {
  keys?: string[];
  mouse?: { x: number; y: number };
  onLevelUp?: () => void;
  onGameOver?: () => void;
}

/** Avance la simulation de `seconds` secondes à pas fixe. */
export const run = (s: GameState, seconds: number, opts: StepOptions = {}) => {
  const keys = new Set(opts.keys ?? []);
  const frames = Math.round(seconds / STEP);
  for (let i = 0; i < frames; i++) {
    const mouse = opts.mouse ?? { x: s.player.x + 1000, y: s.player.y };
    updateGameState(s, STEP, keys, mouse, opts.onLevelUp ?? (() => {}), opts.onGameOver ?? (() => {}));
  }
};

export const totalHp = (e: Entity) => e.defense.hull + e.defense.armor + e.defense.shield;

export const hasNaN = (s: GameState) => {
  const bad = (n: number) => !Number.isFinite(n);
  if (bad(s.player.x) || bad(s.player.y)) return 'player';
  for (const e of s.enemies) if (bad(e.x) || bad(e.y) || Number.isNaN(e.defense.hull)) return `enemy ${e.subtype}`;
  for (const p of s.projectiles) if (bad(p.x) || bad(p.y)) return `projectile ${p.kind}`;
  return null;
};
