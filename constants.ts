
import { DamageType, Tag, Weapon, Stats, Keystone, Passive } from './types';

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;
export const VIEW_SCALE = 1.0;

export const CONTROLS = {
  MOVE_UP: ['z', 'w', 'arrowup'],
  MOVE_DOWN: ['s', 'arrowdown'],
  MOVE_LEFT: ['q', 'a', 'arrowleft'],
  MOVE_RIGHT: ['d', 'arrowright'],
  FIRE: [' ', 'mousedown'],
  ABILITY_1: 'shift',
  ABILITY_2: 'e',
  PAUSE: 'p',
  DEBUG: 'f3'
};

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
  cooling: 15,
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
};

export const DAMAGE_COLORS: Record<DamageType, string> = {
  [DamageType.EM]: '#22d3ee',
  [DamageType.THERMAL]: '#fb923c',
  [DamageType.KINETIC]: '#f8fafc',
  [DamageType.EXPLOSIVE]: '#facc15',
};

export const WEAPON_POOL: Weapon[] = [
  // --- ÉLECTROMAGNÉTIQUE (EM) ---
  { id: 'ion_blaster', name: 'Blaster à Ions', type: DamageType.EM, tags: [Tag.ENERGY, Tag.BALLISTIC], damage: 22, fireRate: 3.5, heatPerShot: 6, bulletSpeed: 18, bulletColor: '#22d3ee', range: 800, lastFired: 0, description: 'Tirs ioniques rapides. Déchire les boucliers.', level: 1 },
  { id: 'emp_pulse', name: 'Pulsar IEM', type: DamageType.EM, tags: [Tag.ENERGY, Tag.AREA], damage: 60, fireRate: 0.8, heatPerShot: 25, bulletSpeed: 10, bulletColor: '#0ea5e9', range: 500, lastFired: 0, description: 'Onde de choc IEM neutralisante.', level: 1 },
  { id: 'arc_disruptor', name: 'Disrupteur d\'Arc', type: DamageType.EM, tags: [Tag.ENERGY, Tag.CHAIN], damage: 18, fireRate: 2.0, heatPerShot: 12, bulletSpeed: 25, bulletColor: '#7dd3fc', range: 600, lastFired: 0, description: 'Éclairs rebondissants entre les cibles.', level: 1 },
  { id: 'disruptor_beam', name: 'Rayon Disrupteur', type: DamageType.EM, tags: [Tag.ENERGY, Tag.BEAM], damage: 12, fireRate: 10.0, heatPerShot: 2, bulletSpeed: 30, bulletColor: '#22d3ee', range: 700, lastFired: 0, description: 'Laser continu affaiblissant.', level: 1 },
  { id: 'em_drone_wing', name: 'Escadrille EM', type: DamageType.EM, tags: [Tag.DRONE, Tag.ENERGY], damage: 30, fireRate: 1.5, heatPerShot: 15, bulletSpeed: 12, bulletColor: '#22d3ee', range: 900, lastFired: 0, description: 'Déploie des drones de combat ioniques.', level: 1 },
  { id: 'overload_missile', name: 'Missile Overload', type: DamageType.EM, tags: [Tag.ENERGY, Tag.HOMING], damage: 85, fireRate: 0.5, heatPerShot: 30, bulletSpeed: 10, bulletColor: '#06b6d4', range: 1200, lastFired: 0, description: 'Missile lourd à tête chercheuse EM.', level: 1 },

  // --- THERMIQUE (THERMAL) ---
  { id: 'solar_flare', name: 'Éclat Solaire', type: DamageType.THERMAL, tags: [Tag.ENERGY, Tag.DOT], damage: 14, fireRate: 4.0, heatPerShot: 5, bulletSpeed: 16, bulletColor: '#fb923c', range: 750, lastFired: 0, description: 'Tirs incendiaires provoquant des brûlures.', level: 1 },
  { id: 'plasma_stream', name: 'Flux de Plasma', type: DamageType.THERMAL, tags: [Tag.ENERGY, Tag.BEAM], damage: 8, fireRate: 12.0, heatPerShot: 3, bulletSpeed: 20, bulletColor: '#f97316', range: 450, lastFired: 0, description: 'Lance-flammes à plasma haute température.', level: 1 },
  { id: 'thermal_lance', name: 'Lance Thermique', type: DamageType.THERMAL, tags: [Tag.ENERGY, Tag.BALLISTIC], damage: 140, fireRate: 0.4, heatPerShot: 50, bulletSpeed: 40, bulletColor: '#ea580c', range: 1300, lastFired: 0, description: 'Rayon de précision perforant l\'armure.', level: 1 },
  { id: 'incinerator_mine', name: 'Mine Incendiaire', type: DamageType.THERMAL, tags: [Tag.AREA, Tag.DOT], damage: 75, fireRate: 0.3, heatPerShot: 20, bulletSpeed: 0, bulletColor: '#fb923c', range: 300, lastFired: 0, description: 'Piège thermique créant une zone de feu.', level: 1 },
  { id: 'fusion_rocket', name: 'Roquette Fusion', type: DamageType.THERMAL, tags: [Tag.EXPLOSIVE, Tag.ENERGY], damage: 95, fireRate: 0.7, heatPerShot: 22, bulletSpeed: 15, bulletColor: '#f59e0b', range: 1000, lastFired: 0, description: 'Projectile explosif à fusion thermique.', level: 1 },
  { id: 'starfire_array', name: 'Matrice Starfire', type: DamageType.THERMAL, tags: [Tag.AREA, Tag.ORBITAL], damage: 25, fireRate: 2.5, heatPerShot: 18, bulletSpeed: 0, bulletColor: '#fbbf24', range: 600, lastFired: 0, description: 'Bombardement de zone aléatoire.', level: 1 },

  // --- CINÉTIQUE (KINETIC) ---
  { id: 'railgun_mk2', name: 'Railgun Mk2', type: DamageType.KINETIC, tags: [Tag.KINETIC, Tag.BALLISTIC], damage: 150, fireRate: 0.3, heatPerShot: 45, bulletSpeed: 50, bulletColor: '#ffffff', range: 1500, lastFired: 0, description: 'Sniper lourd perforant.', level: 1 },
  { id: 'auto_cannon', name: 'Auto-Canon', type: DamageType.KINETIC, tags: [Tag.KINETIC, Tag.BALLISTIC], damage: 16, fireRate: 8.0, heatPerShot: 3, bulletSpeed: 22, bulletColor: '#cbd5e1', range: 900, lastFired: 0, description: 'Mitrailleuse rotative à haute cadence.', level: 1 },
  { id: 'gauss_repeater', name: 'Répéteur Gauss', type: DamageType.KINETIC, tags: [Tag.KINETIC, Tag.BALLISTIC], damage: 48, fireRate: 2.8, heatPerShot: 10, bulletSpeed: 28, bulletColor: '#94a3b8', range: 1100, lastFired: 0, description: 'Fusil d\'assaut électromagnétique équilibré.', level: 1 },
  { id: 'mass_driver', name: 'Mass Driver', type: DamageType.KINETIC, tags: [Tag.KINETIC, Tag.BALLISTIC], damage: 95, fireRate: 1.1, heatPerShot: 18, bulletSpeed: 32, bulletColor: '#f1f5f9', range: 1200, lastFired: 0, description: 'Canon à impact lourd.', level: 1 },
  { id: 'shrapnel_burst', name: 'Shrapnel Burst', type: DamageType.KINETIC, tags: [Tag.KINETIC, Tag.AREA], damage: 12, fireRate: 1.2, heatPerShot: 25, bulletSpeed: 18, bulletColor: '#94a3b8', range: 600, lastFired: 0, description: 'Shotgun spatial à dispersion.', level: 1 },
  { id: 'siege_slug', name: 'Obusier de Siège', type: DamageType.KINETIC, tags: [Tag.KINETIC, Tag.BALLISTIC], damage: 220, fireRate: 0.2, heatPerShot: 60, bulletSpeed: 24, bulletColor: '#ffffff', range: 1800, lastFired: 0, description: 'Artillerie lourde à ultra-longue portée.', level: 1 },

  // --- EXPLOSIF (EXPLOSIVE) ---
  { id: 'cluster_missile', name: 'Missile Grappe', type: DamageType.EXPLOSIVE, tags: [Tag.EXPLOSIVE, Tag.HOMING, Tag.AREA], damage: 55, fireRate: 1.0, heatPerShot: 20, bulletSpeed: 14, bulletColor: '#facc15', range: 900, lastFired: 0, description: 'Missile se divisant en sous-munitions.', level: 1 },
  { id: 'gravity_bomb', name: 'Bombe Gravité', type: DamageType.EXPLOSIVE, tags: [Tag.EXPLOSIVE, Tag.AREA], damage: 90, fireRate: 0.4, heatPerShot: 40, bulletSpeed: 8, bulletColor: '#a855f7', range: 700, lastFired: 0, description: 'Crée un micro trou noir à l\'impact.', level: 1 },
  { id: 'drone_swarm', name: 'Essaim de Drones', type: DamageType.EXPLOSIVE, tags: [Tag.DRONE, Tag.SWARM], damage: 35, fireRate: 0.5, heatPerShot: 35, bulletSpeed: 10, bulletColor: '#fbbf24', range: 800, lastFired: 0, description: 'Lance des drones kamikazes en masse.', level: 1 },
  { id: 'orbital_strike', name: 'Frappe Orbitale', type: DamageType.EXPLOSIVE, tags: [Tag.AREA, Tag.ORBITAL], damage: 120, fireRate: 0.3, heatPerShot: 50, bulletSpeed: 30, bulletColor: '#facc15', range: 2000, lastFired: 0, description: 'Frappe chirurgicale à haute puissance.', level: 1 },
  { id: 'shockwave_emitter', name: 'Onde de Choc', type: DamageType.EXPLOSIVE, tags: [Tag.AREA, Tag.DEFENSIVE], damage: 45, fireRate: 0.8, heatPerShot: 15, bulletSpeed: 5, bulletColor: '#facc15', range: 400, lastFired: 0, description: 'Émet une onde repoussant les ennemis.', level: 1 },
  { id: 'minefield_layer', name: 'Poseur de Mines', type: DamageType.EXPLOSIVE, tags: [Tag.AREA, Tag.BALLISTIC], damage: 65, fireRate: 0.5, heatPerShot: 25, bulletSpeed: 4, bulletColor: '#fde047', range: 500, lastFired: 0, description: 'Déploie un champ de mines tactique.', level: 1 },
];

export const KEYSTONES: Keystone[] = [
  { id: 'blood_frenzy', name: 'Frénésie de Combat', description: 'Vampirisme structurel : +20% Dégâts, mais réduit l\'efficacité de l\'armure de 30%.', modifiers: [
    { id: 'bf-1', property: 'damageMult', value: 1.2, type: 'multiplicative' },
    { id: 'bf-2', property: 'armorHardness', value: 0.7, type: 'multiplicative' }
  ]},
  { id: 'overheat_protocol', name: 'Protocole Surchauffe', description: 'Augmente les dégâts de 50% quand vous êtes au-dessus de 80% de Heat.', modifiers: [
    { id: 'oh-1', property: 'damageMult', value: 1.5, type: 'multiplicative' }
  ]},
];

export const PASSIVES: Passive[] = [
  // --- UTILITAIRES ---
  { id: 'salvager_1', name: 'Salvager I', description: 'Récupérateur d\'Épaves. +30 Portée de ramassage XP.', rarity: 'common', maxStacks: 10, tags: [Tag.MINING], modifiers: [
    { id: 's1-1', property: 'magnetRange', value: 30, type: 'additive' }
  ] },
  { id: 'learning_algorithm', name: 'Algorithme d\'Apprentissage', description: 'Optimise l\'acquisition de données. +15% Gain XP.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'la-1', property: 'xpMult', value: 1.15, type: 'multiplicative' }
  ] },
  { id: 'luck_enhancer', name: 'Injecteur de Probabilités', description: 'Manipule les flux quantiques. +10 Chance.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'le-1', property: 'luck', value: 10, type: 'additive' }
  ] },

  // --- DÉFENSE ---
  { id: 'cap_battery', name: 'Capacitor Battery', description: 'Batterie de Condensateur. +10% Refroidissement.', rarity: 'common', maxStacks: 10, tags: [Tag.ENERGY], modifiers: [
    { id: 'cb-1', property: 'cooling', value: 1.10, type: 'multiplicative' }
  ] },
  { id: 'pds_module', name: 'Power Diagnostic System', description: 'Couteau suisse : +5 Bouclier Max, +0.5 Régén.', rarity: 'common', maxStacks: 10, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'pd-1', property: 'maxShield', value: 5, type: 'additive' },
    { id: 'pd-2', property: 'shieldRegen', value: 0.5, type: 'additive' }
  ] },
  { id: 'hardened_hull', name: 'Châssis Renforcé', description: 'Nanocomposites haute densité. +20 Coque Max.', rarity: 'common', maxStacks: 10, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'hh-1', property: 'maxHull', value: 20, type: 'additive' }
  ] },
  { id: 'reactive_plating', name: 'Placage Réactif', description: 'Dissipe l\'énergie d\'impact. +5% Dureté Armure.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'rp-1', property: 'armorHardness', value: 0.05, type: 'additive' }
  ] },

  // --- ATTAQUE ---
  { id: 'co_processor', name: 'Co-Processeur I', description: 'Optimisation CPU : +3% Cadence, +5% Vitesse Projectile.', rarity: 'common', maxStacks: 10, tags: [Tag.ENERGY], modifiers: [
    { id: 'cp-1', property: 'fireRate', value: 1.03, type: 'multiplicative' },
    { id: 'cp-2', property: 'projectileSpeedMult', value: 1.05, type: 'multiplicative' }
  ] },
  { id: 'targeting_computer', name: 'Calculateur de Tir', description: 'Analyse balistique avancée. +5% Chance de Critique.', rarity: 'rare', maxStacks: 10, tags: [Tag.KINETIC], modifiers: [
    { id: 'tc-1', property: 'critChance', value: 0.05, type: 'additive' }
  ] },
  { id: 'warhead_optimizer', name: 'Optimiseur d\'Ogives', description: 'Augmente la puissance explosive. +10% Dégâts Globaux.', rarity: 'rare', maxStacks: 10, tags: [Tag.EXPLOSIVE], modifiers: [
    { id: 'wo-1', property: 'damageMult', value: 1.10, type: 'multiplicative' }
  ] },

  // --- SPÉCIALISATION ---
  { id: 'thermal_sink', name: 'Dissipateur Thermique', description: 'Gestion de la chaleur extrême. +40 Capacité Heat Max.', rarity: 'common', maxStacks: 5, tags: [Tag.ENERGY, Tag.DOT], modifiers: [
    { id: 'ts-1', property: 'maxHeat', value: 40, type: 'additive' }
  ] },
  { id: 'thruster_overclock', name: 'Overclock Propulseurs', description: 'Surcharge les moteurs. +10% Vitesse et Rotation.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'to-1', property: 'speed', value: 1.10, type: 'multiplicative' },
    { id: 'to-2', property: 'rotationSpeed', value: 1.10, type: 'multiplicative' }
  ] },
  { id: 'quantum_buffer', name: 'Buffer Quantique', description: 'Stabilisation EM. +15% Résistance EM.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY, Tag.DEFENSIVE], modifiers: [
    { id: 'qb-1', property: 'res_EM', value: 0.15, type: 'additive' }
  ] },
  { id: 'heavy_caliber', name: 'Calibre Lourd', description: 'Munitions massives. +15% Dégâts mais -5% Cadence.', rarity: 'epic', maxStacks: 5, tags: [Tag.KINETIC], modifiers: [
    { id: 'hc-1', property: 'damageMult', value: 1.15, type: 'multiplicative' },
    { id: 'hc-2', property: 'fireRate', value: 0.95, type: 'multiplicative' }
  ] },
];
