/**
 * Catalogue des ennemis. Pour ajouter un ennemi : ajouter une entrée dans ENEMIES.
 * - `ai` choisit le pilotage (ai/EnemyAI.ts → AI_BEHAVIORS)
 * - `attacks` décrit les tirs (engine/EnemyAttacks.ts → ATTACK_PATTERNS)
 * - `spawnWeight(wave)` règle la fréquence d'apparition (0 = jamais)
 * - `shape` / `color` règlent le rendu (render/ShipRenderer.ts → SHAPES)
 */
import { DamageType } from '../types';

export type AIBehavior = 'chase' | 'kite' | 'charge' | 'weave' | 'turret';
export type AttackPatternId = 'aimed' | 'spread' | 'radial' | 'summon' | 'spiral' | 'burst';
export type ShipShape = 'fighter' | 'dart' | 'diamond' | 'circle' | 'hex' | 'square' | 'star';

export interface EnemyAttack {
  pattern: AttackPatternId;
  cooldown: number;        // ms
  damage: number;
  type: DamageType;
  speed: number;           // vitesse projectile
  range: number;           // distance max au joueur pour tirer
  color: string;
  count?: number;          // projectiles (spread/radial) ou renforts (summon)
  arc?: number;            // ouverture totale pour 'spread' (radians)
  radius?: number;         // taille projectile
  penetration?: number;
  summonId?: string;       // ennemi invoqué pour 'summon'
  spin?: number;           // 'spiral' : rotation par tir (radians)
}

/** Phase d'enragement : sous `below` (fraction de coque), le boss accélère. */
export interface Enrage {
  below: number;
  cooldownMult: number;    // < 1 = tire plus souvent
  speedMult: number;
  color?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  hull: number;
  armor: number;
  shield: number;
  speed: number;
  radius: number;
  ai: AIBehavior;
  kiteRange?: [number, number];  // distance min / max pour 'kite'
  attacks?: EnemyAttack[];
  contactDps: number;            // dégâts par seconde au contact
  kamikaze?: number;             // dégâts d'explosion au contact (meurt ensuite)
  drops: { count: number; xp: number };
  score: number;
  shape: ShipShape;
  color: string;
  isBoss?: boolean;
  splitInto?: { id: string; count: number };
  enrage?: Enrage;
  resist?: Partial<Record<'res_EM' | 'res_Kinetic' | 'res_Explosive' | 'res_Thermal', number>>;
  armorHardness?: number;
  spawnWeight: (wave: number) => number;
}

const never = () => 0;

export const ENEMIES: Record<string, EnemyDef> = {
  basic: {
    id: 'basic', name: 'Drone', hull: 85, armor: 0, shield: 0, speed: 2.4, radius: 32,
    ai: 'chase', contactDps: 5, drops: { count: 2, xp: 15 }, score: 50,
    shape: 'fighter', color: '#ef4444',
    spawnWeight: () => 10,
  },
  swarmer: {
    id: 'swarmer', name: 'Essaim', hull: 20, armor: 0, shield: 0, speed: 5.2, radius: 16,
    ai: 'weave', contactDps: 4, drops: { count: 1, xp: 12 }, score: 30,
    shape: 'dart', color: '#4ade80',
    spawnWeight: w => (w >= 2 ? 4 : 0),
  },
  gunner: {
    id: 'gunner', name: 'Tireur', hull: 70, armor: 20, shield: 0, speed: 2.2, radius: 28,
    ai: 'kite', kiteRange: [300, 480], contactDps: 5, drops: { count: 3, xp: 18 }, score: 70,
    shape: 'hex', color: '#facc15',
    attacks: [{ pattern: 'spread', cooldown: 2600, damage: 7, type: DamageType.KINETIC, speed: 8, range: 700, color: '#fde047', count: 3, arc: 0.5 }],
    spawnWeight: w => (w >= 3 ? 3 : 0),
  },
  kamikaze: {
    id: 'kamikaze', name: 'Intercepteur', hull: 35, armor: 0, shield: 0, speed: 6.8, radius: 24,
    ai: 'charge', contactDps: 0, kamikaze: 35, drops: { count: 3, xp: 20 }, score: 60,
    shape: 'diamond', color: '#f97316',
    spawnWeight: w => (w >= 4 ? Math.min(3, 1.5 + (w - 4) * 0.2) : 0),
  },
  tank: {
    id: 'tank', name: 'Cuirassé', hull: 220, armor: 180, shield: 0, speed: 1.4, radius: 46,
    ai: 'chase', contactDps: 12, drops: { count: 6, xp: 20 }, score: 150,
    shape: 'square', color: '#60a5fa', armorHardness: 0.25, resist: { res_Kinetic: 0.2 },
    spawnWeight: w => (w >= 5 ? 1.5 : 0),
  },
  sniper: {
    id: 'sniper', name: 'Sniper', hull: 60, armor: 0, shield: 40, speed: 2.6, radius: 28,
    ai: 'kite', kiteRange: [450, 600], contactDps: 5, drops: { count: 4, xp: 25 }, score: 90,
    shape: 'dart', color: '#e2e8f0',
    attacks: [{ pattern: 'aimed', cooldown: 2800, damage: 16, type: DamageType.KINETIC, speed: 18, range: 1200, color: '#ffffff', radius: 4, penetration: 0.2 }],
    spawnWeight: w => (w >= 6 ? Math.min(3, 0.6 + (w - 6) * 0.25) : 0),
  },
  turret: {
    id: 'turret', name: 'Tourelle', hull: 160, armor: 120, shield: 0, speed: 0.6, radius: 34,
    ai: 'turret', contactDps: 6, drops: { count: 5, xp: 22 }, score: 120,
    shape: 'star', color: '#c084fc',
    attacks: [{ pattern: 'radial', cooldown: 2600, damage: 11, type: DamageType.EM, speed: 6, range: 900, color: '#c084fc', count: 8 }],
    spawnWeight: w => (w >= 7 ? 1.2 : 0),
  },
  elite: {
    id: 'elite', name: 'Élite', hull: 320, armor: 100, shield: 150, speed: 3.0, radius: 38,
    ai: 'chase', contactDps: 15, drops: { count: 8, xp: 25 }, score: 300,
    shape: 'fighter', color: '#fb7185', splitInto: { id: 'swarmer', count: 3 },
    attacks: [{ pattern: 'aimed', cooldown: 1500, damage: 14, type: DamageType.THERMAL, speed: 12, range: 650, color: '#fb7185', radius: 6 }],
    spawnWeight: w => (w >= 8 ? Math.min(1.5, 0.4 + (w - 8) * 0.1) : 0),
  },

  // --- Boss (apparaissent toutes les 10 vagues, en rotation : voir BOSS_ROTATION) ---
  boss: {
    id: 'boss', name: 'Dreadnought', hull: 6000, armor: 0, shield: 0, speed: 1.4, radius: 110,
    ai: 'chase', contactDps: 30, drops: { count: 50, xp: 30 }, score: 5000,
    shape: 'circle', color: '#facc15', isBoss: true, enrage: { below: 0.5, cooldownMult: 0.6, speedMult: 1.3 },
    attacks: [{ pattern: 'radial', cooldown: 1100, damage: 15, type: DamageType.EXPLOSIVE, speed: 7.5, range: 2000, color: '#facc15', count: 12, radius: 10 }],
    spawnWeight: never,
  },
  hive: {
    id: 'hive', name: 'Ruche', hull: 4500, armor: 500, shield: 0, speed: 2.0, radius: 95,
    ai: 'weave', contactDps: 25, drops: { count: 50, xp: 30 }, score: 5000,
    shape: 'hex', color: '#4ade80', isBoss: true, enrage: { below: 0.4, cooldownMult: 0.6, speedMult: 1.2 },
    attacks: [
      { pattern: 'summon', cooldown: 4000, damage: 0, type: DamageType.KINETIC, speed: 0, range: 1500, color: '#4ade80', count: 4, summonId: 'swarmer' },
      { pattern: 'spread', cooldown: 1600, damage: 12, type: DamageType.THERMAL, speed: 8, range: 1200, color: '#86efac', count: 7, arc: 1.2, radius: 8 },
    ],
    spawnWeight: never,
  },
  warden: {
    id: 'warden', name: 'Gardien', hull: 5000, armor: 0, shield: 2500, speed: 2.4, radius: 90,
    ai: 'kite', kiteRange: [500, 750], contactDps: 25, drops: { count: 50, xp: 30 }, score: 5000,
    shape: 'star', color: '#22d3ee', isBoss: true, resist: { res_EM: 0.3 }, enrage: { below: 0.5, cooldownMult: 0.65, speedMult: 1.25 },
    attacks: [
      { pattern: 'aimed', cooldown: 700, damage: 16, type: DamageType.EM, speed: 16, range: 1600, color: '#67e8f9', radius: 6 },
      { pattern: 'radial', cooldown: 3500, damage: 12, type: DamageType.EM, speed: 5, range: 1600, color: '#22d3ee', count: 16, radius: 9 },
    ],
    spawnWeight: never,
  },
  carrier: {
    id: 'carrier', name: 'Porte-Nef', hull: 7000, armor: 1500, shield: 0, speed: 1.2, radius: 120,
    ai: 'kite', kiteRange: [600, 900], contactDps: 30, drops: { count: 60, xp: 30 }, score: 7000,
    shape: 'square', color: '#f97316', isBoss: true, resist: { res_Kinetic: 0.25 },
    enrage: { below: 0.5, cooldownMult: 0.55, speedMult: 1.4 },
    attacks: [
      { pattern: 'summon', cooldown: 5000, damage: 0, type: DamageType.KINETIC, speed: 0, range: 1800, color: '#f97316', count: 3, summonId: 'kamikaze' },
      { pattern: 'burst', cooldown: 2400, damage: 12, type: DamageType.KINETIC, speed: 13, range: 1400, color: '#fdba74', count: 5, radius: 7 },
    ],
    spawnWeight: never,
  },
  devastator: {
    id: 'devastator', name: 'Dévastateur', hull: 9000, armor: 0, shield: 4000, speed: 1.6, radius: 105,
    ai: 'chase', contactDps: 40, drops: { count: 70, xp: 30 }, score: 9000,
    shape: 'star', color: '#e879f9', isBoss: true, resist: { res_Thermal: 0.25 },
    enrage: { below: 0.5, cooldownMult: 0.6, speedMult: 1.3 },
    attacks: [
      { pattern: 'spiral', cooldown: 120, damage: 9, type: DamageType.EM, speed: 6, range: 1600, color: '#f0abfc', count: 3, spin: 0.22, radius: 8 },
      { pattern: 'aimed', cooldown: 1800, damage: 22, type: DamageType.EXPLOSIVE, speed: 11, range: 1400, color: '#e879f9', radius: 14 },
    ],
    spawnWeight: never,
  },
};

export const BOSS_ROTATION = ['boss', 'hive', 'warden', 'carrier', 'devastator'];

/** Un boss apparaît à chaque vague multiple de cette valeur. */
export const BOSS_WAVE_INTERVAL = 10;
export const isBossWave = (wave: number) => wave % BOSS_WAVE_INTERVAL === 0;

/** Boss de la vague (toutes les 10 vagues, en rotation). */
export const bossForWave = (wave: number) => BOSS_ROTATION[(Math.floor(wave / BOSS_WAVE_INTERVAL) - 1 + BOSS_ROTATION.length) % BOSS_ROTATION.length];

/** Multiplicateur de résistance des ennemis selon la vague. */
export const difficultyForWave = (wave: number) => 1 + (wave - 1) * 0.15;

/** Tire un type d'ennemi selon les poids de la vague. `rand` ∈ [0,1). */
export const pickEnemyType = (wave: number, rand: number): string => {
  const entries = Object.values(ENEMIES)
    .map(d => [d.id, d.spawnWeight(wave)] as const)
    .filter(([, w]) => w > 0);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rand * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r < 0) return id;
  }
  return entries[entries.length - 1][0];
};
