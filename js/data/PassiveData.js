/**
 * @fileoverview Passive upgrade data definitions for Space InZader
 * Defines all passive items that modify player stats
 */

/**
 * @typedef {Object} PassiveEffects
 * @property {number} [damageMultiplier] - Multiplier for damage
 * @property {number} [fireRateMultiplier] - Multiplier for fire rate
 * @property {number} [critChance] - Critical hit chance (0-1)
 * @property {number} [critMultiplier] - Critical damage multiplier
 * @property {number} [lifesteal] - Lifesteal percentage (0-1)
 * @property {number} [maxHealthMultiplier] - Max health multiplier
 * @property {number} [electricDamageBonus] - Bonus electric damage
 * @property {number} [stunChance] - Chance to stun (0-1)
 * @property {number} [rangeMultiplier] - Range multiplier
 * @property {number} [projectileSpeedMultiplier] - Projectile speed multiplier
 * @property {number} [magnetRange] - XP/pickup magnet range
 * @property {number} [xpMultiplier] - XP gain multiplier
 * @property {number} [armor] - Flat damage reduction
 * @property {number} [speedMultiplier] - Movement speed multiplier
 * @property {number} [dashCooldownReduction] - Dash cooldown reduction (0-1)
 * @property {number} [luck] - Luck bonus (affects drops and rarities)
 * @property {number} [overheatReduction] - Reduces weapon overheat (0-1)
 */

/**
 * @typedef {Object} PassiveData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Passive description
 * @property {string} rarity - Rarity tier (common/uncommon/rare/epic)
 * @property {PassiveEffects} effects - Stat modifications
 * @property {number} maxStacks - Maximum number of times this can be taken
 * @property {string} color - Neon color for visuals
 * @property {string} icon - Icon character/emoji
 */

const PASSIVES = {
  SURCHAUFFE: {
    id: 'surchauffe',
    name: 'Surchauffe',
    description: 'Augmente les dégâts laser. Plus de puissance, plus de chaleur.',
    rarity: 'common',
    effects: {
      damageMultiplier: 0.15,
      overheatReduction: -0.1
    },
    maxStacks: 5,
    color: '#FF4500',
    icon: '🔥'
  },

  RADIATEUR: {
    id: 'radiateur',
    name: 'Radiateur',
    description: 'Refroidissement amélioré. Tire plus vite sans surchauffe.',
    rarity: 'uncommon',
    effects: {
      fireRateMultiplier: 0.12,
      overheatReduction: 0.15
    },
    maxStacks: 5,
    color: '#00BFFF',
    icon: '❄️'
  },

  SANG_FROID: {
    id: 'sang_froid',
    name: 'Sang Froid',
    description: 'Augmente les chances de coup critique et le vol de vie.',
    rarity: 'rare',
    effects: {
      critChance: 0.08,
      critMultiplier: 0.2,
      lifesteal: 0.05
    },
    maxStacks: 4,
    color: '#4169E1',
    icon: '💎'
  },

  COEUR_NOIR: {
    id: 'coeur_noir',
    name: 'Cœur Noir',
    description: 'Énergie vampirique puissante au prix de ta vitalité.',
    rarity: 'rare',
    effects: {
      lifesteal: 0.15,
      maxHealthMultiplier: -0.1,
      damageMultiplier: 0.08
    },
    maxStacks: 3,
    color: '#8B0000',
    icon: '🖤'
  },

  BOBINES_TESLA: {
    id: 'bobines_tesla',
    name: 'Bobines Tesla',
    description: 'Amplifie les dégâts électriques et ajoute une chance d\'étourdissement.',
    rarity: 'uncommon',
    effects: {
      electricDamageBonus: 0.25,
      stunChance: 0.05,
      damageMultiplier: 0.1
    },
    maxStacks: 4,
    color: '#00FFFF',
    icon: '⚡'
  },

  FOCALISEUR: {
    id: 'focaliseur',
    name: 'Focaliseur',
    description: 'Augmente la portée et la vitesse des projectiles.',
    rarity: 'uncommon',
    effects: {
      rangeMultiplier: 0.15,
      projectileSpeedMultiplier: 0.20
    },
    maxStacks: 5,
    color: '#FF00FF',
    icon: '🔍'
  },

  MAG_TRACTOR: {
    id: 'mag_tractor',
    name: 'Mag-Tractor',
    description: 'Attire l\'XP et les bonus de plus loin. Gain d\'XP amélioré.',
    rarity: 'common',
    effects: {
      magnetRange: 50,
      xpMultiplier: 0.10
    },
    maxStacks: 6,
    color: '#FFD700',
    icon: '🧲'
  },

  PLATING: {
    id: 'plating',
    name: 'Plating',
    description: 'Blindage renforcé qui réduit les dégâts reçus.',
    rarity: 'common',
    effects: {
      armor: 2,
      maxHealthMultiplier: 0.05
    },
    maxStacks: 8,
    color: '#C0C0C0',
    icon: '🛡️'
  },

  REACTEUR: {
    id: 'reacteur',
    name: 'Réacteur',
    description: 'Moteurs surpuissants. Plus rapide, dash rechargé plus vite.',
    rarity: 'uncommon',
    effects: {
      speedMultiplier: 0.10,
      dashCooldownReduction: 0.12
    },
    maxStacks: 5,
    color: '#FF6347',
    icon: '🚀'
  },

  CHANCE: {
    id: 'chance',
    name: 'Chance',
    description: 'Améliore la chance. Objets rares plus fréquents.',
    rarity: 'rare',
    effects: {
      luck: 0.15,
      critChance: 0.03
    },
    maxStacks: 5,
    color: '#FFD700',
    icon: '🍀'
  }
};

/**
 * Get passive data by ID
 * @param {string} passiveId - Passive identifier
 * @returns {PassiveData|null}
 */
function getPassiveData(passiveId) {
  return PASSIVES[passiveId.toUpperCase()] || null;
}

/**
 * Calculate total effects from multiple passive stacks
 * @param {Array<{id: string, stacks: number}>} passives - Array of passive IDs with stack counts
 * @returns {PassiveEffects}
 */
function calculateTotalEffects(passives) {
  const totalEffects = {};

  for (const passive of passives) {
    const data = getPassiveData(passive.id);
    if (!data) continue;

    const stacks = Math.min(passive.stacks, data.maxStacks);
    
    for (const [effect, value] of Object.entries(data.effects)) {
      if (!totalEffects[effect]) {
        totalEffects[effect] = 0;
      }
      totalEffects[effect] += value * stacks;
    }
  }

  return totalEffects;
}

/**
 * Get rarity weight for passive selection
 * @param {string} rarity - Rarity tier
 * @param {number} luck - Player luck stat
 * @returns {number}
 */
function getRarityWeight(rarity, luck = 0) {
  const baseWeights = {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 5
  };

  const weight = baseWeights[rarity] || 0;
  
  // Luck shifts weights towards rarer items
  if (rarity === 'common') {
    return Math.max(10, weight - luck * 20);
  } else if (rarity === 'uncommon') {
    return weight + luck * 10;
  } else if (rarity === 'rare') {
    return weight + luck * 15;
  } else if (rarity === 'epic') {
    return weight + luck * 25;
  }
  
  return weight;
}

/**
 * Get random passive based on rarity weights and luck
 * @param {number} luck - Player luck stat
 * @param {Array<string>} exclude - Passive IDs to exclude
 * @returns {PassiveData|null}
 */
function getRandomPassive(luck = 0, exclude = []) {
  const available = Object.values(PASSIVES).filter(
    p => !exclude.includes(p.id)
  );

  if (available.length === 0) return null;

  const weights = available.map(p => getRarityWeight(p.rarity, luck));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < available.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return available[i];
    }
  }

  return available[available.length - 1];
}

// Export to global namespace
const PassiveData = {
  PASSIVES,
  getPassiveData,
  calculateTotalEffects,
  getRarityWeight,
  getRandomPassive
};

if (typeof window !== 'undefined') {
  window.PassiveData = PassiveData;
}
