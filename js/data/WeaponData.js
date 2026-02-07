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

export const WEAPONS = {
  LASER_FRONTAL: {
    id: 'laser_frontal',
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
  }
};

/**
 * Weapon evolution definitions
 * Combines maxed weapons with passives to create ultimate weapons
 */
export const WEAPON_EVOLUTIONS = {
  RAYON_PLASMA: {
    id: 'rayon_plasma_continu',
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
export function getWeaponData(weaponId) {
  return WEAPONS[weaponId.toUpperCase()] || null;
}

/**
 * Get evolution for weapon and passive combination
 * @param {string} weaponId - Current weapon ID
 * @param {number} weaponLevel - Current weapon level
 * @param {string} passiveId - Passive ID
 * @returns {Object|null}
 */
export function getWeaponEvolution(weaponId, weaponLevel, passiveId) {
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
