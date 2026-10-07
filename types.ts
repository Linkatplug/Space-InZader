
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
  lifesteal: number;           // fraction des dégâts infligés rendue à la coque
  hullRegen: number;           // coque / seconde
  explosionRadiusMult: number;
  heatGenMult: number;         // multiplicateur de chaleur générée par tir
  burnMult: number;            // multiplicateur des brûlures infligées
  extraChain: number;          // rebonds supplémentaires (armes 'chain')
  extraDrones: number;         // drones supplémentaires (armes 'drone')
  extraProjectiles: number;    // projectiles supplémentaires (armes 'projectile' multi-tirs)
  abilityCooldownMult: number;
  extraPierce: number;         // ennemis traversés en plus (projectiles)
  executeBonus: number;        // dégâts en plus contre les ennemis sous 30% de coque
  healOnKill: number;          // coque rendue par élimination
  slowOnHit: number;           // chance de ralentir à l'impact (0..1)
  abilityPowerMult: number;    // puissance des compétences (dégâts, rayon, durée)
  dashDistanceMult: number;    // distance du dash
  pickupChance: number;        // multiplicateur de chance de butin (capsules, nanites…)
}

/**
 * Conditions d'activation d'un modificateur (voir engine/Conditions.ts → CONDITIONS).
 * Un modificateur conditionnel ne s'applique que tant que la condition est vraie.
 */
export type ConditionId = 'highHeat' | 'lowHull' | 'stationary' | 'shieldDown' | 'overheated';

/**
 * Source de mise à l'échelle (voir engine/Conditions.ts → SCALING_SOURCES).
 * Un modificateur « scaling » vaut value × min(source, max) et est toujours additif.
 */
export type ScalingSource = 'hitStreak' | 'droneCount' | 'comboCount' | 'onHitStacks';

export interface Modifier {
  id: string;
  property: keyof Stats;
  value: number;
  type: 'additive' | 'multiplicative';
  condition?: ConditionId;
  scaling?: { source: ScalingSource; max: number };
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
  ION_STORM = 'ION_STORM',
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
  warning: number;      // secondes d'alerte restantes
  started: boolean;     // false pendant l'alerte
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

/**
 * Comportement d'une arme. `kind` choisit la routine de tir dans WeaponSystem,
 * les autres champs sont des paramètres optionnels de cette routine.
 */
export type WeaponKind =
  | 'projectile' // balle(s) tirée(s) vers le curseur
  | 'beam'       // rayon instantané (hitscan) qui transperce
  | 'chain'      // arc électrique qui rebondit entre cibles
  | 'pulse'      // onde de choc circulaire autour du vaisseau
  | 'strike'     // frappe orbitale différée sur une cible
  | 'drone'      // drones en orbite qui tirent seuls
  | 'flame'      // cône de flammes courte portée
  | 'mine';      // mine posée qui explose au contact

export interface WeaponBehavior {
  kind: WeaponKind;
  count?: number;          // projectiles / drones / frappes par tir
  spread?: number;         // dispersion angulaire totale (radians)
  jitter?: number;         // imprécision aléatoire (radians)
  pierce?: number;         // nombre d'ennemis traversés
  homing?: number;         // vitesse de virage (radians / frame)
  explodeRadius?: number;  // explosion à l'impact
  burn?: number;           // brûlure : fraction des dégâts infligée par seconde pendant 3s
  slow?: number;           // ralentissement (0..1) pendant 2s
  knockback?: number;      // recul infligé
  split?: number;          // sous-munitions à l'explosion
  gravity?: boolean;       // crée un puits gravitationnel à l'impact
  fireZone?: boolean;      // laisse une zone de feu à l'impact
  chainTargets?: number;   // rebonds pour 'chain'
  autoTarget?: boolean;    // vise l'ennemi le plus proche au lieu du curseur
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
  behavior: WeaponBehavior;
  /** Bonus de comportement débloqués en Tech II / Tech III (fusionnés dans `behavior`). */
  tech?: { 2?: Partial<WeaponBehavior>; 3?: Partial<WeaponBehavior> };
  /** Texte des bonus de Tech II / Tech III (affiché dans le menu d'amélioration). */
  techNotes?: [string, string];
  /** Modificateurs appliqués au vaisseau tant que l'arme est équipée (ex. masse : −vitesse, −blindage). */
  modifiers?: Modifier[];
}

export interface Keystone {
  id: string;
  name: string;
  description: string;
  modifiers: Modifier[];
  icon?: string;
  color?: string;
}

/** Mécaniques spéciales débloquées par les synergies (voir engine/Combat.ts). */
export type MechanicId = 'critExplosion' | 'chainExplosion' | 'burnSpread' | 'dashInvuln';

export interface SynergyTier {
  count: number;            // nombre de tags requis
  description: string;
  modifiers?: Modifier[];
  mechanic?: MechanicId;
}

export interface Synergy {
  id: string;
  name: string;
  color: string;
  tags: Tag[];              // tags comptés (une fois par arme / passif possédé)
  tiers: SynergyTier[];     // triés par count croissant
}

/** Bonus temporaire (compétence) : modificateurs appliqués au joueur jusqu'à `until`. */
export interface Buff {
  id: string;
  name: string;
  until: number;        // ms (horloge state.time)
  duration: number;     // durée totale (ms), pour afficher une jauge
  modifiers: Modifier[];
  color: string;
}

export interface ShipClass {
  id: string;
  name: string;
  description: string;
  color: string;
  stats: Partial<Stats>;    // remplace les valeurs de INITIAL_STATS
  startingWeapon: string;
  signatureKeystone: string; // proposé en priorité au premier palier de keystone
  preferredTags: Tag[];      // les améliorations portant ces tags sortent plus souvent
  abilities: [string, string]; // compétences (Shift, E) — ids de engine/AbilitySystem.ts → ABILITIES
  difficulty: 'facile' | 'moyen' | 'difficile';
  unlock?: { type: 'wave'; wave: number } | { type: 'kills'; kills: number };
}

export interface VisualEffect {
  id: string;
  kind?: 'damage' | 'message';   // 'damage' = chiffre de dégâts (masquable dans les options)
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

/** Butin ramassable lâché par les ennemis (voir data/pickups.ts). */
export type PickupKind = 'shield' | 'hull' | 'armor' | 'wormhole';

export interface Pickup {
  id: string;
  kind: PickupKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;       // secondes restantes avant disparition
}

export interface XPDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
  vx: number;
  vy: number;
  collected: boolean;
  vortex?: boolean;   // aspiré vers le joueur par un trou de ver
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
  subtype?: string;        // id dans data/enemies.ts (ENEMIES)
  attackTimers?: number[]; // dernier tir de chaque attaque (ms)
  spiralAngle?: number;    // angle courant du motif 'spiral'
  enraged?: boolean;       // boss en phase d'enragement
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
  // Vitesse externe (recul, gravité) ajoutée au mouvement piloté, amortie chaque frame
  kx?: number;
  ky?: number;
  burn?: { dps: number; until: number; type: DamageType };
  slow?: { amount: number; until: number };
  invulnUntil?: number;     // invulnérable jusqu'à (ms, horloge state.time)
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
  kind?: 'bullet' | 'missile' | 'mine' | 'flame' | 'gravity' | 'meteor';
  pierce?: number;
  hitIds?: string[];
  homing?: number;
  explodeRadius?: number;
  burn?: number;
  slow?: number;
  knockback?: number;
  split?: number;
  gravity?: boolean;
  fireZone?: boolean;
  life?: number;          // durée de vie en secondes (mines, flammes)
  source?: string;        // origine (id d'ennemi, événement) pour les statistiques
  uid?: string;           // identifiant (météores destructibles)
  hp?: number;            // points de structure (météores destructibles)
  maxHp?: number;
  armTime?: number;       // délai avant activation (mines)
}

/** Zone persistante : explosion visuelle, feu, puits gravitationnel, frappe en approche. */
export interface Zone {
  id: string;
  kind: 'explosion' | 'fire' | 'gravity' | 'strike' | 'pulse' | 'wormhole';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
  packet?: DamagePacket;  // dégâts (par seconde pour fire/gravity, une fois pour strike)
  knockback?: number;
  slow?: number;
  burn?: number;
  hazard?: string;   // zone environnementale : touche aussi le joueur (valeur = source, ex. 'ion_storm')
  emphasis?: boolean; // effet de compétence : rendu plus marqué (flash + anneau épais)
}

/** Trait visuel éphémère : rayon, arc électrique. */
export interface Beam {
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
  jagged?: boolean;
}

export interface Drone {
  id: string;
  weaponId: string;
  angle: number;
  x: number;
  y: number;
  lastFired: number;
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
  pickups: Pickup[];
  effects: VisualEffect[];
  particles: Particle[];
  activeWeapons: Weapon[];
  zones: Zone[];
  beams: Beam[];
  drones: Drone[];
  time: number;          // horloge de simulation (ms), figée en pause
  shake: number;         // intensité de tremblement demandée par le moteur
  autoFire: boolean;
  spawnEnabled: boolean; // apparition automatique des ennemis (désactivable : tests, labo)
  autoAim: boolean;       // vise automatiquement l'ennemi le plus proche (mode tactile)
  analogMove: { x: number; y: number }; // déplacement analogique (joystick tactile), -1..1
  shipId: string;
  hitStreak: number;        // impacts consécutifs sans tir manqué
  onHitStacks: number;      // cumul « à l'impact » (retombe après 3s sans toucher)
  lastHitTime: number;
  stationaryTime: number;   // secondes passées immobile
  mechanics: MechanicId[];  // mécaniques actives (synergies)
  buffs: Buff[];            // bonus temporaires actifs (compétences)
  enemySlowUntil: number;   // ms : projectiles ennemis ralentis jusqu'à (Distorsion)
  bossKills: number;
  nextEventTime: number;    // ms (horloge state.time), 0 = à planifier
  damageDealt: number;
  damageTaken: number;
  damageBySource: Record<string, number>; // dégâts subis par origine (ennemi, événement...)
  lastHitBy?: string;
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
