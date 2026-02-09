/**
 * @fileoverview Weapon data definitions for Space InZader
 * Defines all weapons, their properties, and evolution paths
 */

/**
 * @typedef {Object} WeaponLevel
 * @property {number} damage - Damage multiplier
 * @property {number} [projectileCount] - Number of projectiles
 * @property {number} [area] - Area of effect
 * @property {number} [duration] - Effect duration
 * @property {number} [piercing] - Piercing count
 * @property {number} [chainCount] - Chain/bounce count
 */

/**
 * @typedef {Object} WeaponData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Weapon description
 * @property {number} baseDamage - Base damage value
 * @property {number} fireRate - Shots per second
 * @property {number} projectileSpeed - Speed of projectiles
 * @property {number} maxLevel - Maximum upgrade level
 * @property {string} rarity - Rarity tier (common/uncommon/rare/epic)
 * @property {string} color - Neon color for visuals
 * @property {string} type - Weapon type/category
 * @property {WeaponLevel[]} levels - Level progression data
 */

const WEAPONS = {
  LASER_FRONTAL: {
    id: 'laser_frontal',
    tags: ['projectile', 'fire_rate', 'piercing', 'range'],
    name: 'Laser Frontal',
    description: 'Tirs laser directs à haute cadence. Classique mais efficace.',
    baseDamage: 15,
    fireRate: 3.0,
    projectileSpeed: 800,
    maxLevel: 8,
    rarity: 'common',
    color: '#00FFFF',
    type: 'direct',
    levels: [
      { damage: 1.0, projectileCount: 1 },
      { damage: 1.2, projectileCount: 1 },
      { damage: 1.4, projectileCount: 2 },
      { damage: 1.6, projectileCount: 2 },
      { damage: 1.8, projectileCount: 2, piercing: 1 },
      { damage: 2.0, projectileCount: 3, piercing: 1 },
      { damage: 2.3, projectileCount: 3, piercing: 2 },
      { damage: 2.6, projectileCount: 4, piercing: 2 }
    ]
  },

  MITRAILLE: {
    id: 'mitraille',
    tags: ['projectile', 'fire_rate', 'shotgun', 'short_range'],
    name: 'Mitraille',
    description: 'Cône de projectiles rapides. Excellent contre les essaims.',
    baseDamage: 8,
    fireRate: 8.0,
    projectileSpeed: 600,
    maxLevel: 8,
    rarity: 'common',
    color: '#FFD700',
    type: 'spread',
    levels: [
      { damage: 1.0, projectileCount: 3, area: 20 },
      { damage: 1.15, projectileCount: 4, area: 25 },
      { damage: 1.3, projectileCount: 5, area: 30 },
      { damage: 1.45, projectileCount: 6, area: 35 },
      { damage: 1.6, projectileCount: 7, area: 40 },
      { damage: 1.8, projectileCount: 8, area: 45 },
      { damage: 2.0, projectileCount: 9, area: 50 },
      { damage: 2.2, projectileCount: 10, area: 55 }
    ]
  },

  MISSILES_GUIDES: {
    id: 'missiles_guides',
    tags: ['projectile', 'homing', 'explosive', 'aoe'],
    name: 'Missiles Guidés',
    description: 'Missiles à tête chercheuse avec explosion à l\'impact.',
    baseDamage: 45,
    fireRate: 1.2,
    projectileSpeed: 400,
    maxLevel: 8,
    rarity: 'uncommon',
    color: '#FF4500',
    type: 'homing',
    levels: [
      { damage: 1.0, projectileCount: 1, area: 60 },
      { damage: 1.2, projectileCount: 1, area: 70 },
      { damage: 1.4, projectileCount: 2, area: 80 },
      { damage: 1.6, projectileCount: 2, area: 90 },
      { damage: 1.8, projectileCount: 3, area: 100 },
      { damage: 2.0, projectileCount: 3, area: 110 },
      { damage: 2.3, projectileCount: 4, area: 120 },
      { damage: 2.6, projectileCount: 4, area: 140 }
    ]
  },

  ORBES_ORBITAUX: {
    id: 'orbes_orbitaux',
    tags: ['orbital', 'melee', 'utility'],
    name: 'Orbes Orbitaux',
    description: 'Sphères d\'énergie en orbite qui endommagent au contact.',
    baseDamage: 20,
    fireRate: 0,
    projectileSpeed: 0,
    maxLevel: 8,
    rarity: 'uncommon',
    color: '#9370DB',
    type: 'orbital',
    levels: [
      { damage: 1.0, projectileCount: 2, area: 100 },
      { damage: 1.2, projectileCount: 2, area: 110 },
      { damage: 1.4, projectileCount: 3, area: 120 },
      { damage: 1.6, projectileCount: 3, area: 130 },
      { damage: 1.8, projectileCount: 4, area: 140 },
      { damage: 2.0, projectileCount: 4, area: 150 },
      { damage: 2.3, projectileCount: 5, area: 160 },
      { damage: 2.6, projectileCount: 5, area: 180 }
    ]
  },

  RAYON_VAMPIRIQUE: {
    id: 'rayon_vampirique',
    tags: ['beam', 'vampire', 'piercing', 'range'],
    name: 'Rayon Vampirique',
    description: 'Rayon continu qui draine la vie des ennemis.',
    baseDamage: 10,
    fireRate: 20.0,
    projectileSpeed: 0,
    maxLevel: 8,
    rarity: 'rare',
    color: '#DC143C',
    type: 'beam',
    levels: [
      { damage: 1.0, area: 200, duration: 1.0 },
      { damage: 1.2, area: 220, duration: 1.0 },
      { damage: 1.4, area: 240, duration: 1.0 },
      { damage: 1.6, area: 260, duration: 1.0 },
      { damage: 1.8, area: 280, duration: 1.0, piercing: 1 },
      { damage: 2.0, area: 300, duration: 1.0, piercing: 2 },
      { damage: 2.3, area: 320, duration: 1.0, piercing: 3 },
      { damage: 2.6, area: 350, duration: 1.0, piercing: 4 }
    ]
  },

  MINES: {
    id: 'mines',
    tags: ['projectile', 'explosive', 'aoe', 'utility'],
    name: 'Mines',
    description: 'Pose des mines qui explosent au contact des ennemis.',
    baseDamage: 80,
    fireRate: 0.8,
    projectileSpeed: 200,
    maxLevel: 8,
    rarity: 'uncommon',
    color: '#FF1493',
    type: 'mine',
    levels: [
      { damage: 1.0, projectileCount: 1, area: 80, duration: 10 },
      { damage: 1.2, projectileCount: 1, area: 90, duration: 12 },
      { damage: 1.4, projectileCount: 2, area: 100, duration: 14 },
      { damage: 1.6, projectileCount: 2, area: 110, duration: 16 },
      { damage: 1.8, projectileCount: 3, area: 120, duration: 18 },
      { damage: 2.0, projectileCount: 3, area: 130, duration: 20 },
      { damage: 2.3, projectileCount: 4, area: 140, duration: 22 },
      { damage: 2.6, projectileCount: 4, area: 160, duration: 25 }
    ]
  },

  ARC_ELECTRIQUE: {
    id: 'arc_electrique',
    tags: ['projectile', 'electric', 'aoe', 'range'],
    name: 'Arc Électrique',
    description: 'Éclair qui rebondit entre les ennemis proches.',
    baseDamage: 25,
    fireRate: 2.0,
    projectileSpeed: 1200,
    maxLevel: 8,
    rarity: 'rare',
    color: '#00FFFF',
    type: 'chain',
    levels: [
      { damage: 1.0, chainCount: 3, area: 150 },
      { damage: 1.2, chainCount: 4, area: 160 },
      { damage: 1.4, chainCount: 5, area: 170 },
      { damage: 1.6, chainCount: 6, area: 180 },
      { damage: 1.8, chainCount: 7, area: 190 },
      { damage: 2.0, chainCount: 8, area: 200 },
      { damage: 2.3, chainCount: 10, area: 220 },
      { damage: 2.6, chainCount: 12, area: 250 }
    ]
  },

  TOURELLE_DRONE: {
    id: 'tourelle_drone',
    tags: ['summon', 'turret', 'projectile', 'utility'],
    name: 'Tourelle Drone',
    description: 'Déploie un drone allié qui tire automatiquement.',
    baseDamage: 12,
    fireRate: 4.0,
    projectileSpeed: 700,
    maxLevel: 8,
    rarity: 'epic',
    color: '#00FF00',
    type: 'turret',
    levels: [
      { damage: 1.0, projectileCount: 1, duration: 15 },
      { damage: 1.2, projectileCount: 1, duration: 18 },
      { damage: 1.4, projectileCount: 2, duration: 20 },
      { damage: 1.6, projectileCount: 2, duration: 22 },
      { damage: 1.8, projectileCount: 2, duration: 25 },
      { damage: 2.0, projectileCount: 3, duration: 28 },
      { damage: 2.3, projectileCount: 3, duration: 30 },
      { damage: 2.6, projectileCount: 3, duration: 35 }
    ]
  },

  // New weapons with strategic maluses
  RAILGUN: {
    id: 'railgun',
    tags: ['projectile', 'piercing', 'crit', 'heat', 'glass_cannon'],
    name: 'Railgun',
    description: 'Canon électromagnétique dévastateur. Pénétration infinie mais surchauffe rapide. -40% cadence de tir.',
    baseDamage: 80,
    fireRate: 0.4,
    projectileSpeed: 2000,
    maxLevel: 8,
    rarity: 'rare',
    color: '#00CCFF',
    type: 'railgun',
    levels: [
      { damage: 1.0, projectileCount: 1, piercing: 999 },
      { damage: 1.3, projectileCount: 1, piercing: 999 },
      { damage: 1.6, projectileCount: 1, piercing: 999 },
      { damage: 2.0, projectileCount: 1, piercing: 999 },
      { damage: 2.4, projectileCount: 2, piercing: 999 },
      { damage: 2.8, projectileCount: 2, piercing: 999 },
      { damage: 3.3, projectileCount: 2, piercing: 999 },
      { damage: 4.0, projectileCount: 2, piercing: 999 }
    ],
    malus: {
      heatGeneration: 2.0,
      fireRateMultiplier: 0.6
    }
  },

  LANCE_FLAMMES: {
    id: 'flamethrower',
    tags: ['heat', 'aoe', 'dot', 'short_range', 'glass_cannon'],
    name: 'Lance-Flammes',
    description: 'Projette un cône de flammes. Haute cadence mais désactive les critiques. Courte portée.',
    baseDamage: 5,
    fireRate: 10.0,
    projectileSpeed: 300,
    maxLevel: 8,
    rarity: 'uncommon',
    color: '#FF6600',
    type: 'flamethrower',
    levels: [
      { damage: 1.0, projectileCount: 5, area: 30 },
      { damage: 1.15, projectileCount: 6, area: 35 },
      { damage: 1.3, projectileCount: 7, area: 40 },
      { damage: 1.5, projectileCount: 8, area: 45 },
      { damage: 1.7, projectileCount: 9, area: 50 },
      { damage: 2.0, projectileCount: 10, area: 55 },
      { damage: 2.3, projectileCount: 11, area: 60 },
      { damage: 2.7, projectileCount: 12, area: 65 }
    ],
    malus: {
      critDisabled: true,
      heatGeneration: 3.0,
      rangeMultiplier: 0.5
    }
  },

  CANON_GRAVITATIONNEL: {
    id: 'gravity_cannon',
    tags: ['aoe', 'control', 'utility', 'slow'],
    name: 'Canon Gravitationnel',
    description: 'Tire des orbes qui attirent les ennemis... et vous aussi! Zone d\'attraction.',
    baseDamage: 25,
    fireRate: 0.8,
    projectileSpeed: 400,
    maxLevel: 8,
    rarity: 'rare',
    color: '#9932CC',
    type: 'gravity',
    levels: [
      { damage: 1.0, projectileCount: 1, area: 120 },
      { damage: 1.2, projectileCount: 1, area: 140 },
      { damage: 1.4, projectileCount: 1, area: 160 },
      { damage: 1.7, projectileCount: 2, area: 180 },
      { damage: 2.0, projectileCount: 2, area: 200 },
      { damage: 2.3, projectileCount: 2, area: 220 },
      { damage: 2.7, projectileCount: 3, area: 240 },
      { damage: 3.2, projectileCount: 3, area: 260 }
    ],
    malus: {
      playerAttraction: 0.4
    }
  },

  TOURELLE_AUTONOME: {
    id: 'auto_turret',
    tags: ['summon', 'turret', 'support', 'utility'],
    name: 'Tourelle Autonome',
    description: 'Déploie une tourelle fixe puissante. Stationnaire mais efficace.',
    baseDamage: 18,
    fireRate: 1.5,
    projectileSpeed: 750,
    maxLevel: 8,
    rarity: 'uncommon',
    color: '#00FF88',
    type: 'static_turret',
    levels: [
      { damage: 1.0, projectileCount: 1, duration: 20 },
      { damage: 1.2, projectileCount: 1, duration: 24 },
      { damage: 1.5, projectileCount: 2, duration: 28 },
      { damage: 1.8, projectileCount: 2, duration: 32 },
      { damage: 2.1, projectileCount: 2, duration: 36 },
      { damage: 2.5, projectileCount: 3, duration: 40 },
      { damage: 2.9, projectileCount: 3, duration: 45 },
      { damage: 3.5, projectileCount: 3, duration: 50 }
    ],
    malus: {
      stationary: true,
      maxSummons: 1
    }
  },

  LAMES_FANTOMES: {
    id: 'phantom_blades',
    tags: ['melee', 'orbit', 'aoe', 'short_range'],
    name: 'Lames Fantômes',
    description: 'Lames orbitales éthérées. -40% dégâts contre les boss.',
    baseDamage: 20,
    fireRate: 0,
    projectileSpeed: 0,
    maxLevel: 8,
    rarity: 'rare',
    color: '#9370DB',
    type: 'orbit_melee',
    levels: [
      { damage: 1.0, projectileCount: 2, area: 90 },
      { damage: 1.2, projectileCount: 2, area: 95 },
      { damage: 1.5, projectileCount: 3, area: 100 },
      { damage: 1.8, projectileCount: 3, area: 105 },
      { damage: 2.1, projectileCount: 4, area: 110 },
      { damage: 2.5, projectileCount: 4, area: 115 },
      { damage: 2.9, projectileCount: 5, area: 120 },
      { damage: 3.5, projectileCount: 5, area: 130 }
    ],
    malus: {
      bossDamageMultiplier: 0.6
    }
  },

  DRONE_KAMIKAZE: {
    id: 'kamikaze_drone',
    tags: ['summon', 'explosive', 'burst', 'glass_cannon'],
    name: 'Drone Kamikaze',
    description: 'Drone explosif suicide. Énormes dégâts de zone mais 20% auto-dégâts.',
    baseDamage: 120,
    fireRate: 0.125,
    projectileSpeed: 250,
    maxLevel: 8,
    rarity: 'epic',
    color: '#FF0000',
    type: 'kamikaze',
    levels: [
      { damage: 1.0, projectileCount: 1, area: 150 },
      { damage: 1.3, projectileCount: 1, area: 170 },
      { damage: 1.6, projectileCount: 1, area: 190 },
      { damage: 2.0, projectileCount: 1, area: 210 },
      { damage: 2.4, projectileCount: 2, area: 230 },
      { damage: 2.9, projectileCount: 2, area: 250 },
      { damage: 3.5, projectileCount: 2, area: 280 },
      { damage: 4.2, projectileCount: 2, area: 320 }
    ],
    malus: {
      selfDamage: 0.2,
      cooldown: 8.0
    }
  }
};

/**
 * Weapon evolution definitions
 * Combines maxed weapons with passives to create ultimate weapons
 */
const WEAPON_EVOLUTIONS = {
  RAYON_PLASMA: {
    id: 'rayon_plasma_continu',
    tags: ['beam', 'piercing', 'range', 'heat'],
    name: 'Rayon Plasma Continu',
    description: 'Évolution ultime du laser. Rayon continu dévastateur.',
    requiredWeapon: 'laser_frontal',
    requiredWeaponLevel: 8,
    requiredPassive: 'radiateur',
    baseDamage: 40,
    fireRate: 0,
    projectileSpeed: 0,
    color: '#00FFFF',
    type: 'continuous_beam',
    stats: {
      damage: 3.5,
      area: 400,
      piercing: 999,
      duration: 1.0
    }
  },

  SALVES_MULTI: {
    id: 'salves_multi_verrouillage',
    tags: ['projectile', 'homing', 'explosive', 'aoe'],
    name: 'Salves Multi-Verrouillage',
    description: 'Évolution des missiles. Salves massives de missiles intelligents.',
    requiredWeapon: 'missiles_guides',
    requiredWeaponLevel: 8,
    requiredPassive: 'focaliseur',
    baseDamage: 55,
    fireRate: 2.0,
    projectileSpeed: 600,
    color: '#FF6600',
    type: 'mega_homing',
    stats: {
      damage: 3.0,
      projectileCount: 8,
      area: 180,
      piercing: 0
    }
  },

  COURONNE_GRAVITATIONNELLE: {
    id: 'couronne_gravitationnelle',
    tags: ['orbital', 'aoe', 'melee', 'slow'],
    name: 'Couronne Gravitationnelle',
    description: 'Évolution des orbes. Attire et broie les ennemis.',
    requiredWeapon: 'orbes_orbitaux',
    requiredWeaponLevel: 8,
    requiredPassive: 'mag_tractor',
    baseDamage: 35,
    fireRate: 0,
    projectileSpeed: 0,
    color: '#9370DB',
    type: 'gravity_field',
    stats: {
      damage: 3.2,
      projectileCount: 8,
      area: 250,
      duration: 1.0
    }
  },

  TEMPETE_IONIQUE: {
    id: 'tempete_ionique',
    tags: ['projectile', 'electric', 'aoe', 'range'],
    name: 'Tempête Ionique',
    description: 'Évolution de l\'arc électrique. Décharge foudroyante massive.',
    requiredWeapon: 'arc_electrique',
    requiredWeaponLevel: 8,
    requiredPassive: 'bobines_tesla',
    baseDamage: 45,
    fireRate: 3.0,
    projectileSpeed: 1500,
    color: '#00FFFF',
    type: 'storm',
    stats: {
      damage: 3.8,
      chainCount: 20,
      area: 350,
      piercing: 0
    }
  }
};

/**
 * Get weapon data by ID
 * @param {string} weaponId - Weapon identifier
 * @returns {WeaponData|null}
 */
function getWeaponData(weaponId) {
  return WEAPONS[weaponId.toUpperCase()] || null;
}

/**
 * Get evolution for weapon and passive combination
 * @param {string} weaponId - Current weapon ID
 * @param {number} weaponLevel - Current weapon level
 * @param {string} passiveId - Passive ID
 * @returns {Object|null}
 */
function getWeaponEvolution(weaponId, weaponLevel, passiveId) {
  for (const evolution of Object.values(WEAPON_EVOLUTIONS)) {
    if (
      evolution.requiredWeapon === weaponId &&
      evolution.requiredWeaponLevel <= weaponLevel &&
      evolution.requiredPassive === passiveId
    ) {
      return evolution;
    }
  }
  return null;
}

// Export to global namespace
const WeaponData = {
  WEAPONS,
  WEAPON_EVOLUTIONS,
  getWeaponData,
  getWeaponEvolution
};

if (typeof window !== 'undefined') {
  window.WeaponData = WeaponData;
}
