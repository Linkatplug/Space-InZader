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
 * @property {string} color - Primary ship color (neon)
 * @property {string} secondaryColor - Secondary ship color
 * @property {string} difficulty - Difficulty rating (easy/medium/hard)
 * @property {string} sprite - Sprite identifier or shape
 */

export const SHIPS = {
  DEFENSEUR: {
    id: 'defenseur',
    name: 'Défenseur',
    description: 'Vaisseau blindé avec plus de points de vie. Idéal pour les débutants qui préfèrent la survie.',
    baseStats: {
      maxHealth: 120,
      healthRegen: 0.5,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      speed: 200,
      armor: 3,
      lifesteal: 0.0,
      critChance: 0.05,
      critMultiplier: 1.5,
      magnetRange: 80,
      dashCooldown: 3.0,
      luck: 0.0
    },
    startingWeapon: 'laser_frontal',
    color: '#00BFFF',
    secondaryColor: '#1E90FF',
    difficulty: 'easy',
    sprite: 'ship_tank'
  },

  MITRAILLEUR: {
    id: 'mitrailleur',
    name: 'Mitrailleur',
    description: 'Frappe rapide et cadence élevée. Déluge de balles contre les hordes.',
    baseStats: {
      maxHealth: 80,
      healthRegen: 0.3,
      damageMultiplier: 0.85,
      fireRateMultiplier: 1.35,
      speed: 220,
      armor: 1,
      lifesteal: 0.0,
      critChance: 0.08,
      critMultiplier: 1.5,
      magnetRange: 80,
      dashCooldown: 2.5,
      luck: 0.0
    },
    startingWeapon: 'mitraille',
    color: '#FFD700',
    secondaryColor: '#FFA500',
    difficulty: 'medium',
    sprite: 'ship_gunship'
  },

  EQUILIBRE: {
    id: 'equilibre',
    name: 'Équilibré',
    description: 'Statistiques équilibrées pour un gameplay polyvalent. Bon en tout.',
    baseStats: {
      maxHealth: 100,
      healthRegen: 0.4,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      speed: 210,
      armor: 2,
      lifesteal: 0.0,
      critChance: 0.06,
      critMultiplier: 1.5,
      magnetRange: 90,
      dashCooldown: 2.8,
      luck: 0.05
    },
    startingWeapon: 'orbes_orbitaux',
    color: '#9370DB',
    secondaryColor: '#8A2BE2',
    difficulty: 'easy',
    sprite: 'ship_balanced'
  },

  VAMPIRE: {
    id: 'vampire',
    name: 'Vampire',
    description: 'Vol de vie élevé mais fragile. Risque et récompense. Pour experts.',
    baseStats: {
      maxHealth: 70,
      healthRegen: 0.0,
      damageMultiplier: 1.15,
      fireRateMultiplier: 0.95,
      speed: 215,
      armor: 0,
      lifesteal: 0.15,
      critChance: 0.10,
      critMultiplier: 1.75,
      magnetRange: 100,
      dashCooldown: 2.2,
      luck: 0.1
    },
    startingWeapon: 'rayon_vampirique',
    color: '#DC143C',
    secondaryColor: '#8B0000',
    difficulty: 'hard',
    sprite: 'ship_vampire'
  }
};

/**
 * Get ship data by ID
 * @param {string} shipId - Ship identifier
 * @returns {ShipData|null}
 */
export function getShipData(shipId) {
  return SHIPS[shipId.toUpperCase()] || null;
}

/**
 * Get all ships sorted by difficulty
 * @returns {ShipData[]}
 */
export function getAllShips() {
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
export function calculateEffectiveStats(baseStats, passiveEffects = {}) {
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
export function getShipUnlockRequirements(shipId) {
  const requirements = {
    defenseur: null, // Always unlocked
    equilibre: null, // Always unlocked
    mitrailleur: {
      description: 'Atteindre le niveau 10 avec n\'importe quel vaisseau',
      level: 10
    },
    vampire: {
      description: 'Atteindre le niveau 20 et tuer 1000 ennemis',
      level: 20,
      kills: 1000
    }
  };

  return requirements[shipId] || null;
}

/**
 * Check if a ship is unlocked based on player progress
 * @param {string} shipId - Ship identifier
 * @param {Object} playerProgress - Player progress data
 * @returns {boolean}
 */
export function isShipUnlocked(shipId, playerProgress) {
  const requirements = getShipUnlockRequirements(shipId);
  
  if (!requirements) return true; // No requirements means always unlocked
  
  if (requirements.level && playerProgress.maxLevel < requirements.level) {
    return false;
  }
  
  if (requirements.kills && playerProgress.totalKills < requirements.kills) {
    return false;
  }
  
  return true;
}
