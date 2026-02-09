/**
 * @fileoverview Ship/Character data definitions for Space InZader
 * Defines playable ships with unique stats and starting weapons
 */

/**
 * @typedef {Object} ShipStats
 * @property {number} maxHealth - Maximum health points
 * @property {number} healthRegen - Health regeneration per second
 * @property {number} damageMultiplier - Base damage multiplier
 * @property {number} fireRateMultiplier - Base fire rate multiplier
 * @property {number} speed - Movement speed
 * @property {number} armor - Flat damage reduction
 * @property {number} lifesteal - Lifesteal percentage (0-1)
 * @property {number} critChance - Critical hit chance (0-1)
 * @property {number} critMultiplier - Critical damage multiplier
 * @property {number} magnetRange - XP/pickup magnet range
 * @property {number} dashCooldown - Dash ability cooldown in seconds
 * @property {number} luck - Base luck value
 */

/**
 * @typedef {Object} ShipData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Ship description and playstyle
 * @property {ShipStats} baseStats - Starting statistics
 * @property {string} startingWeapon - ID of starting weapon
 * @property {string[]} preferredTags - Tags for upgrade filtering
 * @property {string[]} bannedTags - Tags to exclude from upgrades
 * @property {string[]} preferredWeapons - Preferred weapon IDs
 * @property {string[]} preferredPassives - Preferred passive IDs
 * @property {string|null} keystoneId - Unique keystone passive ID
 * @property {boolean} unlocked - Whether ship is unlocked
 * @property {Object|null} unlockCondition - Unlock requirements
 * @property {string} color - Primary ship color (neon)
 * @property {string} secondaryColor - Secondary ship color
 * @property {string} difficulty - Difficulty rating (easy/medium/hard)
 * @property {string} sprite - Sprite identifier or shape
 */

const SHIPS = {
  VAMPIRE: {
    id: 'vampire',
    name: 'Vampire',
    description: 'Sustain through lifesteal and critical strikes',
    baseStats: {
      maxHealth: 80,
      healthRegen: 0.0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 0.8,
      speed: 220 * 1.05,
      armor: 0,
      lifesteal: 0.15,
      critChance: 0.05,
      critMultiplier: 1.5,
      magnetRange: 100,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'rayon_vampirique',
    preferredTags: ['vampire', 'on_hit', 'on_kill', 'crit', 'regen'],
    bannedTags: ['shield', 'summon'],
    preferredWeapons: ['rayon_vampirique', 'orbes_orbitaux'],
    preferredPassives: ['vampirisme', 'sang_froid', 'coeur_noir'],
    keystoneId: 'blood_frenzy',
    unlocked: true,
    unlockCondition: null,
    color: '#DC143C',
    secondaryColor: '#8B0000',
    difficulty: 'hard',
    sprite: 'ship_vampire'
  },

  MITRAILLEUR: {
    id: 'mitrailleur',
    name: 'Gunner',
    description: 'High fire rate, overheat mechanics',
    baseStats: {
      maxHealth: 100,
      healthRegen: 0.0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 0.9,
      speed: 220,
      armor: 0,
      lifesteal: 0.0,
      critChance: 0.05,
      critMultiplier: 1.5,
      magnetRange: 100,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'mitraille',
    preferredTags: ['fire_rate', 'heat', 'projectile', 'crit'],
    bannedTags: ['beam', 'slow_time'],
    preferredWeapons: ['mitraille', 'laser_frontal', 'missiles_guides'],
    preferredPassives: ['cadence_rapide', 'radiateur', 'multi_tir'],
    keystoneId: 'overclock_core',
    unlocked: true,
    unlockCondition: null,
    color: '#FFD700',
    secondaryColor: '#FFA500',
    difficulty: 'medium',
    sprite: 'ship_gunship'
  },

  TANK: {
    id: 'tank',
    name: 'Fortress',
    description: 'High armor and area control',
    baseStats: {
      maxHealth: 160,
      healthRegen: 0.0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 0.7,
      speed: 220 * 0.85,
      armor: 4,
      lifesteal: 0.0,
      critChance: 0.05,
      critMultiplier: 1.5,
      magnetRange: 100,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'laser_frontal',
    preferredTags: ['armor', 'shield', 'aoe', 'thorns'],
    bannedTags: ['dash', 'glass_cannon'],
    preferredWeapons: ['canon_lourd', 'mines', 'arc_electrique'],
    preferredPassives: ['plating', 'vitalite', 'bouclier_energie'],
    keystoneId: 'fortress_mode',
    unlocked: true,
    unlockCondition: null,
    color: '#00BFFF',
    secondaryColor: '#1E90FF',
    difficulty: 'easy',
    sprite: 'ship_tank'
  },

  SNIPER: {
    id: 'sniper',
    name: 'Dead Eye',
    description: 'Critical hits and precision',
    baseStats: {
      maxHealth: 90,
      healthRegen: 0.0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 0.75,
      speed: 220,
      armor: 0,
      lifesteal: 0.0,
      critChance: 0.08,
      critMultiplier: 1.7,
      magnetRange: 100 * 1.25,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'laser_frontal',
    preferredTags: ['crit', 'range', 'piercing', 'slow'],
    bannedTags: ['shotgun', 'short_range'],
    preferredWeapons: ['railgun', 'missiles_guides'],
    preferredPassives: ['critique_mortel', 'precision', 'focaliseur'],
    keystoneId: 'dead_eye',
    unlocked: true,
    unlockCondition: null,
    color: '#9370DB',
    secondaryColor: '#8A2BE2',
    difficulty: 'medium',
    sprite: 'ship_sniper'
  },

  ENGINEER: {
    id: 'engineer',
    name: 'Engineer',
    description: 'Summons and turrets',
    baseStats: {
      maxHealth: 110,
      healthRegen: 0.0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 0.8,
      speed: 220,
      armor: 0,
      lifesteal: 0.0,
      critChance: 0.05,
      critMultiplier: 1.5,
      magnetRange: 100,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'orbes_orbitaux',
    preferredTags: ['summon', 'turret', 'utility', 'aoe'],
    bannedTags: ['vampire', 'glass_cannon'],
    preferredWeapons: ['tourelle_drone', 'orbes_orbitaux'],
    preferredPassives: ['arsenal_orbital'],
    keystoneId: 'machine_network',
    unlocked: false,
    unlockCondition: { type: 'wave_reached', wave: 15 },
    color: '#00FF88',
    secondaryColor: '#00DD66',
    difficulty: 'medium',
    sprite: 'ship_engineer'
  },

  BERSERKER: {
    id: 'berserker',
    name: 'Berserker',
    description: 'Melee fury and speed',
    baseStats: {
      maxHealth: 85,
      healthRegen: 0.0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 0.85,
      speed: 220 * 1.15,
      armor: 0,
      lifesteal: 0.0,
      critChance: 0.05,
      critMultiplier: 1.5,
      magnetRange: 100,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'lame_tournoyante',
    preferredTags: ['berserk', 'melee', 'speed', 'on_hit'],
    bannedTags: ['shield', 'regen'],
    preferredWeapons: ['lames_energetiques', 'lame_tournoyante'],
    preferredPassives: ['fureur_combat', 'berserker', 'execution'],
    keystoneId: 'rage_engine',
    unlocked: false,
    unlockCondition: { type: 'die_with_tags_count', tagsAnyOf: ['vampire', 'crit'], minCount: 5 },
    color: '#FF4444',
    secondaryColor: '#CC0000',
    difficulty: 'hard',
    sprite: 'ship_berserker'
  }
};

/**
 * Get ship data by ID
 * @param {string} shipId - Ship identifier
 * @returns {ShipData|null}
 */
function getShipData(shipId) {
  return SHIPS[shipId.toUpperCase()] || null;
}

/**
 * Get all ships sorted by difficulty
 * @returns {ShipData[]}
 */
function getAllShips() {
  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  return Object.values(SHIPS).sort((a, b) => {
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
}

/**
 * Calculate effective stats with passive bonuses
 * @param {ShipStats} baseStats - Base ship statistics
 * @param {Object} passiveEffects - Effects from passive items
 * @returns {ShipStats}
 */
function calculateEffectiveStats(baseStats, passiveEffects = {}) {
  const stats = { ...baseStats };

  // Apply multiplicative bonuses
  if (passiveEffects.damageMultiplier) {
    stats.damageMultiplier *= (1 + passiveEffects.damageMultiplier);
  }
  if (passiveEffects.fireRateMultiplier) {
    stats.fireRateMultiplier *= (1 + passiveEffects.fireRateMultiplier);
  }
  if (passiveEffects.maxHealthMultiplier) {
    stats.maxHealth *= (1 + passiveEffects.maxHealthMultiplier);
  }
  if (passiveEffects.speedMultiplier) {
    stats.speed *= (1 + passiveEffects.speedMultiplier);
  }
  if (passiveEffects.rangeMultiplier) {
    // Range is applied to weapons, not ship stats
  }
  if (passiveEffects.projectileSpeedMultiplier) {
    // Applied to weapons, not ship stats
  }

  // Apply additive bonuses
  if (passiveEffects.armor) {
    stats.armor += passiveEffects.armor;
  }
  if (passiveEffects.lifesteal) {
    stats.lifesteal += passiveEffects.lifesteal;
  }
  if (passiveEffects.critChance) {
    stats.critChance = Math.min(1.0, stats.critChance + passiveEffects.critChance);
  }
  if (passiveEffects.critMultiplier) {
    stats.critMultiplier += passiveEffects.critMultiplier;
  }
  if (passiveEffects.magnetRange) {
    stats.magnetRange += passiveEffects.magnetRange;
  }
  if (passiveEffects.luck) {
    stats.luck += passiveEffects.luck;
  }
  if (passiveEffects.dashCooldownReduction) {
    stats.dashCooldown *= (1 - passiveEffects.dashCooldownReduction);
  }

  return stats;
}

/**
 * Get ship unlock requirements
 * @param {string} shipId - Ship identifier
 * @returns {Object|null}
 */
function getShipUnlockRequirements(shipId) {
  const ship = getShipData(shipId);
  return ship ? ship.unlockCondition : null;
}

/**
 * Check if a ship is unlocked based on player progress
 * @param {string} shipId - Ship identifier
 * @param {Object} playerProgress - Player progress data
 * @returns {boolean}
 */
function isShipUnlocked(shipId, playerProgress) {
  const ship = getShipData(shipId);
  if (!ship) return false;
  if (ship.unlocked) return true;
  
  const condition = ship.unlockCondition;
  if (!condition) return true;
  
  switch (condition.type) {
    case 'wave_reached':
      return playerProgress.maxWave >= condition.wave;
    case 'die_with_tags_count':
      const tagCount = playerProgress.dieWithTagsCounts || {};
      let count = 0;
      condition.tagsAnyOf.forEach(tag => {
        count += tagCount[tag] || 0;
      });
      return count >= condition.minCount;
    default:
      return false;
  }
}

// Export to global namespace
const ShipData = {
  SHIPS,
  getShipData,
  getAllShips,
  calculateEffectiveStats,
  getShipUnlockRequirements,
  isShipUnlocked
};

if (typeof window !== 'undefined') {
  window.ShipData = ShipData;
}
