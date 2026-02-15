
export enum DamageType {
  EM = 'EM',
  KINETIC = 'KINETIC',
  EXPLOSIVE = 'EXPLOSIVE',
  THERMAL = 'THERMAL',
}

export enum Tag {
  ENERGY = 'Energy',
  DRONE = 'Drone',
  EXPLOSIVE = 'Explosive',
  BEAM = 'Beam',
  KINETIC = 'Kinetic',
  MINING = 'Mining',
  SWARM = 'Swarm',
  DEFENSIVE = 'Defensive',
  AREA = 'Area',
  DOT = 'DoT',
  CHAIN = 'Chain',
  HOMING = 'Homing',
  ORBITAL = 'Orbital',
  BALLISTIC = 'Ballistic',
}

export interface Stats {
  maxShield: number;
  maxArmor: number;
  maxHull: number;
  shieldRegen: number;
  armorHardness: number;
  speed: number;
  rotationSpeed: number;
  damageMult: number;
  fireRate: number;
  critChance: number;
  critMult: number;
  cooling: number;
  maxHeat: number; 
  magnetRange: number;
  xpMult: number;
  res_EM: number;
  res_Kinetic: number;
  res_Explosive: number;
  res_Thermal: number;
  res_Hull: number;
  dmgTakenMult: number;
  auraSlowAmount: number;
  auraSlowRange: number; 
  overheatHullDmg: number;
  missTolerance: number;
  comboWindow: number;
  rangeMult: number;
  projectileSpeedMult: number;
  dodgeChance: number;
  luck: number;
}

export interface Modifier {
  id: string;
  property: keyof Stats;
  value: number;
  type: 'additive' | 'multiplicative';
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  modifiers: Modifier[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  maxStacks: number;
  tags: Tag[];
}

export interface ActiveAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  icon: string;
  key: string;
  execute: (state: GameState) => void;
}

export enum EnvEventType {
  SOLAR_STORM = 'SOLAR_STORM',
  BLACK_HOLE = 'BLACK_HOLE',
  MAGNETIC_STORM = 'MAGNETIC_STORM',
  ASTEROID_BELT = 'ASTEROID_BELT'
}

export interface EnvironmentalEvent {
  id: string;
  type: EnvEventType;
  x: number;
  y: number;
  radius: number;
  duration: number;
  maxDuration: number;
  intensity: number;
}

export interface DamagePacket {
  amount: number;
  type: DamageType;
  penetration: number;
  isCrit: boolean;
  isSynergy?: boolean;
}

export interface DefenseState {
  shield: number;
  armor: number;
  hull: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: DamageType;
  tags: Tag[];
  damage: number;
  fireRate: number;
  heatPerShot: number;
  bulletSpeed: number;
  bulletColor: string;
  range: number;
  lastFired: number;
  description: string;
  level: number;
}

export interface Keystone {
  id: string;
  name: string;
  description: string;
  modifiers: Modifier[];
}

export interface VisualEffect {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vx: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface XPDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
  vx: number;
  vy: number;
  collected: boolean;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'player' | 'enemy' | 'boss';
  subtype?: 'basic' | 'sniper' | 'kamikaze' | 'swarmer' | 'boss';
  dead?: boolean;
  baseStats: Stats;
  modifiers: Modifier[];
  runtimeStats: Stats;
  statsDirty: boolean;
  defense: DefenseState;
  currentSlow?: number;
  lastFired?: number;
  lastDamageTime?: number; 
  marks?: { type: 'resonance', count: number };
  isGodMode?: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  packet: DamagePacket;
  color: string;
  ownerId: string;
  radius: number;
  distanceTraveled: number;
  maxRange: number;
  dead?: boolean;
  heatGenerated: number;
}

export interface GameState {
  player: Entity;
  heat: number;
  maxHeat: number;
  isOverheated: boolean;
  score: number;
  level: number;
  experience: number;
  expToNextLevel: number;
  wave: number;
  waveTimer: number;
  waveKills: number;
  waveQuota: number;
  totalKills: number;
  startTime: number;
  enemies: Entity[];
  projectiles: Projectile[];
  xpDrops: XPDrop[];
  effects: VisualEffect[];
  particles: Particle[];
  activeWeapons: Weapon[];
  activeAbilities: ActiveAbility[];
  activeEvents: EnvironmentalEvent[];
  keystones: Keystone[];
  activePassives: { passive: Passive, stacks: number }[];
  status: 'playing' | 'paused' | 'menu' | 'gameover' | 'leveling' | 'dev' | 'lab';
  comboCount: number;
  comboTimer: number;
  currentMisses: number;
  bossSpawned: boolean;
  isDebugMode: boolean;
}
