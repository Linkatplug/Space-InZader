
import { DamageType, Stats } from './types';

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;
/** Zoom de la caméra : 1 sur grand écran, dézoomé sur petit écran (mobile) pour voir plus loin. */
export const viewScaleFor = (d: { width: number; height: number }) =>
  Math.max(0.55, Math.min(1, d.width / 1280, d.height / 800));

export const CONTROLS = {
  MOVE_UP: ['z', 'w', 'arrowup'],
  MOVE_DOWN: ['s', 'arrowdown'],
  MOVE_LEFT: ['q', 'a', 'arrowleft'],
  MOVE_RIGHT: ['d', 'arrowright'],
  FIRE: [' ', 'mousedown'],
  ABILITY_1: 'shift',
  ABILITY_2: 'e',
  PAUSE: 'p',
  AUTO_FIRE: 'f',
  MUTE: 'm',
  NEXT_TRACK: 'n',
  DEBUG: 'f3'
};

export const MAX_WEAPON_SLOTS = 6;

export const TECH_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 1.9,
};

export const INITIAL_STATS: Stats = {
  maxShield: 50,
  maxArmor: 100,
  maxHull: 100,
  shieldRegen: 2,
  armorHardness: 0.1,
  speed: 6,
  rotationSpeed: 0.1,
  damageMult: 1,
  fireRate: 1,
  critChance: 0.05,
  critMult: 2.0,
  cooling: 28,
  maxHeat: 250,
  magnetRange: 120,
  xpMult: 1,
  res_EM: 0,
  res_Kinetic: 0,
  res_Explosive: 0,
  res_Thermal: 0,
  res_Hull: 0,
  dmgTakenMult: 1.0,
  auraSlowAmount: 0,
  auraSlowRange: 0,
  overheatHullDmg: 0,
  missTolerance: 0,
  comboWindow: 1.0,
  rangeMult: 1.0,
  projectileSpeedMult: 1.0,
  dodgeChance: 0,
  luck: 0,
  lifesteal: 0,
  hullRegen: 0,
  explosionRadiusMult: 1,
  heatGenMult: 1,
  burnMult: 1,
  extraChain: 0,
  extraDrones: 0,
  extraProjectiles: 0,
  abilityCooldownMult: 1,
  extraPierce: 0,
  executeBonus: 0,
  healOnKill: 0,
  slowOnHit: 0,
  abilityPowerMult: 1,
  dashDistanceMult: 1,
  pickupChance: 1,
};

export const DAMAGE_COLORS: Record<DamageType, string> = {
  [DamageType.EM]: '#22d3ee',
  [DamageType.THERMAL]: '#fb923c',
  [DamageType.KINETIC]: '#f8fafc',
  [DamageType.EXPLOSIVE]: '#facc15',
};
